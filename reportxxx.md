# VOXORA Static & Logic Audit Report (`reportxxx.md`)

**Date:** 2026-07-24  
**Scope:** Full End-to-End Codebase (Backend, Frontend, Docker, Configs)  
**Auditor:** Senior QA Engineer & Security Auditor  

---

| Issue Title | Severity | File / Location | Description | Impact | Suggested Fix |
|---|---|---|---|---|---|
| **Arbitrary File Deletion via Path Traversal** | **Critical** | `backend/src/routes/uploadRoutes.ts` (Lines 29–38) | Endpoint `DELETE /api/upload/:filePath(*)` joins `process.cwd()` with `req.params.filePath` without sanitizing `..` relative paths or verifying that the resolved path stays inside `uploads/`. | Authenticated users can delete arbitrary files anywhere on the host filesystem (e.g., source code, configuration files, system binaries). | Resolve path with `path.resolve` and verify `fullPath.startsWith(path.join(process.cwd(), 'uploads'))`. |
| **Missing Tenant Isolation in Contact Groups** | **High** | `backend/src/controllers/contactGroupController.ts` (Line 10) | `getContactGroups` calls `ContactGroup.find()` with an empty filter `{}` instead of scoping queries by `{ owner: req.user.userId }`. | Non-admin users can view and list contact groups created by other users across tenants. | Filter queries by `owner: req.user.userId` unless `req.user.role === 'admin'`. |
| **Missing Tenant Isolation in CRM Contacts List** | **High** | `backend/src/controllers/crmController.ts` (Line 25) | `listContacts` queries `Contact.find(query)` without enforcing user ownership or assigned team filters. | CRM users can view all contacts across all accounts on the platform. | Apply `{ createdBy: req.user.userId }` or team-level ownership filtering. |
| **Hardcoded Admin ObjectId Fallback in Schemas** | **Medium** | `backend/src/models/ContactGroup.ts` (Line 35), `backend/src/models/Contact.ts` (Line 171), `backend/src/models/Campaign.ts` (Line 190) | Mongoose schemas default `owner` / `createdBy` to `'650000000000000000000001'` if omitted during document creation. | Documents created by API calls missing explicit user assignment silently default ownership to a hardcoded admin ID. | Remove schema default or set `required: true` so ownership must be explicitly provided. |
| **Unprotected Direct File Upload Endpoint** | **Low** | `backend/src/routes/importRoutes.ts` (Line 12) | Endpoint `POST /api/import/excel` uses `uploadMiddleware.single('file')` but doesn't validate user ID scoping during parse phase. | Unvalidated files can be parsed into memory before confirmation. | Validate file MIME types and size constraints before processing. |

---

### Audit Summary
- **Total Files Audited:** 68
- **Critical Severity:** 1
- **High Severity:** 2
- **Medium Severity:** 1
- **Low Severity:** 1
- **Code Modifications Made:** 0 (Read-only audit per instruction rules)
