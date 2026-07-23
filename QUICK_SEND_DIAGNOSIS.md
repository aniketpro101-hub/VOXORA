# 🔍 Quick Send Bug Diagnosis Report

**Developer:** Mr. Aniket Samant (Telegram: `@actasiff`)  
**Audit Status:** COMPLETE — Root cause identified with exact line numbers  
**Bug Summary:** Quick Send delivers `"Quick Send 15:30:27"` (the campaign name) instead of the actual user message text.

---

## 1. 🎯 Root Cause Analysis

### Primary Issue
When Quick Send creates a campaign payload via `apiClient.post('/campaigns', payload)`, it passes the message text under the property key `message`:
```json
{
  "name": "Quick Send 15:30:27",
  "message": "Actual message text written by user...",
  "mediaFiles": ["/uploads/image1.jpg", "/uploads/image2.jpg"]
}
```

However, in **`backend/src/models/Campaign.ts`**, the Mongoose `CampaignSchema` **does not include `message` or `mediaUrl` in the schema definition**. 

As a result, Mongoose **silently strips the `message` field** during `Campaign.create(data)`. `message` is never stored in MongoDB.

When the background campaign dispatcher runs (`backend/src/services/campaignService.ts`, Line 116):
```typescript
const messageTemplate = campaign.messageTemplates?.[0] || campaign.message || campaign.name;
```
1. `campaign.messageTemplates?.[0]` evaluates to `undefined` (because `messageTemplates` is an empty array `[]`).
2. `campaign.message` evaluates to `undefined` (because Mongoose stripped `message` during schema validation).
3. The expression **falls back to `campaign.name`**, which holds `"Quick Send 15:30:27"`.

Therefore, the campaign engine dispatches `"Quick Send 15:30:27"` to WhatsApp instead of the user's message!

---

## 2. 🔄 Complete Data Flow Analysis

### Step 1: Frontend Form Collection (`frontend/src/app/(dashboard)/campaigns/quick/page.tsx`, Lines 64-75)
The user enters text, selects images, and clicks "Send Now". The payload constructed is:
```typescript
const payload = {
  name: `Quick Send ${new Date().toLocaleTimeString()}`, // "Quick Send 15:30:27"
  campaignType: 'instant',
  message: 'My promotional text here...',                 // STRIPPED BY MONGOOSE SCHEMA
  instanceIds: [selectedInstanceId],
  totalContacts: 2,
  recipientNumbers: ['919876543210', '919999999999'],
  mediaUrl: '/uploads/file1.jpg',                          // STRIPPED BY MONGOOSE SCHEMA
  mediaFiles: ['/uploads/file1.jpg', '/uploads/file2.jpg'],
  buttons: [{ id: 'b1', text: 'Opt In' }]
};
```

### Step 2: Backend Controller (`backend/src/controllers/campaignController.ts`, Lines 9-16)
`createCampaign` receives `req.body` and calls `CampaignService.createCampaign(req.body, userId)`.

### Step 3: Campaign Service Creation (`backend/src/services/campaignService.ts`, Lines 45-60)
`CampaignService.createCampaign` calls Mongoose:
```typescript
const campaign = await Campaign.create({
  ...data,
  contacts: contactIds,
  owner: userId,
  status: 'draft',
  totalContacts
});
```
Because `CampaignSchema` in `models/Campaign.ts` lacks `message` and `mediaUrl`, Mongoose filters out `data.message` and `data.mediaUrl`.

### Step 4: Database Storage (`backend/src/models/Campaign.ts`, Lines 89-181)
Saved MongoDB Document state:
- `name`: `"Quick Send 15:30:27"`
- `message`: `undefined` (stripped)
- `messageTemplate`: `""` (default empty string)
- `messageTemplates`: `[]` (empty array)
- `mediaUrl`: `undefined` (stripped)
- `mediaFiles`: `["/uploads/file1.jpg", "/uploads/file2.jpg"]`

### Step 5: Background Execution (`backend/src/services/campaignService.ts`, Lines 116, 139)
In `processCampaignMessages`:
```typescript
const messageTemplate = campaign.messageTemplates?.[0] || campaign.message || campaign.name;
// Evaluates to: undefined || undefined || "Quick Send 15:30:27"
// Result: messageTemplate = "Quick Send 15:30:27"
```

### Step 6: Dispatch to Baileys Engine (`backend/src/services/baileysEngine.ts`, Line 135)
Baileys engine sends `"Quick Send 15:30:27"` to the recipient's phone number on WhatsApp.

---

## 3. 📉 Where Data Gets Lost

| Data Element | Payload Field | Saved to DB? | Reason for Loss |
|---|---|---|---|
| **Message Text** | `message` | ❌ NO | Mongoose `CampaignSchema` missing `message` field |
| **Primary Media URL** | `mediaUrl` | ❌ NO | Mongoose `CampaignSchema` missing `mediaUrl` field |
| **Template Fallback** | `messageTemplate` | ❌ NO | Frontend payload passes `message`, not `messageTemplate` |
| **Campaign Name** | `name` | ✅ YES | Saved as `"Quick Send 15:30:27"` and used as fallback message text |

---

## 4. 🧩 Code Snippets Showing the Bug

### Snippet 1: Schema Missing `message` & `mediaUrl` Fields
- **File:** [backend/src/models/Campaign.ts](file:///c:/Users/Aniket/Documents/VOXORA/backend/src/models/Campaign.ts#L89-L135) (Lines 89-135)
```typescript
// BUG: CampaignSchema definition lacks 'message' and 'mediaUrl'
const CampaignSchema: Schema<ICampaign> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    messageTemplate: { type: String, default: '' },
    messageTemplates: [{ type: String }],
    // MISSING: message: { type: String }
    // MISSING: mediaUrl: { type: String }
    mediaFiles: [{ type: String }],
    ...
```

### Snippet 2: Service Fallback to `campaign.name`
- **File:** [backend/src/services/campaignService.ts](file:///c:/Users/Aniket/Documents/VOXORA/backend/src/services/campaignService.ts#L116) (Line 116)
```typescript
// BUG: When message and messageTemplates are undefined, falls back to name ("Quick Send 15:30:27")
const messageTemplate = campaign.messageTemplates?.[0] || campaign.message || campaign.name;
```

### Snippet 3: Frontend Payload Field Name Mismatch
- **File:** [frontend/src/app/(dashboard)/campaigns/quick/page.tsx](file:///c:/Users/Aniket/Documents/VOXORA/frontend/src/app/(dashboard)/campaigns/quick/page.tsx#L64-L75) (Lines 64-75)
```typescript
// Payload sends 'message' and 'messageTemplates', but backend model only registers 'messageTemplate' or 'messageTemplates'
const payload = {
  name: `Quick Send ${new Date().toLocaleTimeString()}`,
  campaignType: 'instant',
  message, // Key is 'message', but schema expects 'messageTemplate' / 'messageTemplates'
  ...
};
```

---

## 5. 🛠️ Required Fixes

1. **Fix `Campaign.ts` Mongoose Schema (`backend/src/models/Campaign.ts`):**
   - Add `message: { type: String, default: '' }` to `CampaignSchema`.
   - Add `mediaUrl: { type: String, default: '' }` to `CampaignSchema`.

2. **Fix `createCampaign` in `CampaignService` (`backend/src/services/campaignService.ts`):**
   - Ensure `messageTemplate`, `messageTemplates`, and `message` are synchronized on creation:
     ```typescript
     if (data.message && (!data.messageTemplates || data.messageTemplates.length === 0)) {
       data.messageTemplates = [data.message];
       data.messageTemplate = data.message;
     }
     ```

3. **Fix Payload Construction in `QuickCampaignPage` (`frontend/src/app/(dashboard)/campaigns/quick/page.tsx`):**
   - Explicitly include `messageTemplate: message` and `messageTemplates: [message]` in the POST payload alongside `message`.

---

## 6. 🧪 Testing Recommendations

After applying the fixes, perform the following verification:
1. **Quick Send Text Verification:** Send a Quick Message with text `"Hello Test"` -> Confirm recipient receives `"Hello Test"` (not `"Quick Send 15:30:27"`).
2. **Quick Send Image Verification:** Attach 2 JPG files -> Confirm recipient receives both JPG images with text caption.
3. **Quick Send Buttons Verification:** Add 2 buttons -> Confirm recipient receives formatted option menu.

---
*Diagnosis completed. Ready for review.*
