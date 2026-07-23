export const GREETING_KEYWORDS = {
  english: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon'],
  hindi: ['नमस्ते', 'namaste', 'hello ji', 'pranam'],
  marathi: ['नमस्कार', 'namaskar', 'hello ji'],
  hinglish: ['hi ji', 'hello bhai', 'kya hal hai'],
};

export const PRICE_INQUIRY_KEYWORDS = {
  english: ['price', 'cost', 'rate', 'how much', 'pricing', 'charge'],
  hindi: ['केमत', 'keemat', 'daam', 'rate', 'kitne ka', 'kitna h'],
  marathi: ['किंमत', 'kimat', 'rate', 'kiti'],
};

export const OPT_OUT_KEYWORDS = {
  english: ['stop', 'unsubscribe', 'cancel', 'opt out', 'remove me'],
  hindi: ['band karo', 'ruk jao', 'mat bhejo', 'nahi chahiye'],
  marathi: ['thambva', 'nako'],
};

export const INTERESTED_KEYWORDS = {
  english: ['yes', 'interested', 'buy', 'purchase', 'want to buy', 'info'],
  hindi: ['haan', 'chahiye', 'kharidna hai', 'bhejo'],
  marathi: ['ho', 'pahije'],
};

export const ALL_PRESET_KEYWORDS = {
  ...GREETING_KEYWORDS,
  ...PRICE_INQUIRY_KEYWORDS,
  ...OPT_OUT_KEYWORDS,
  ...INTERESTED_KEYWORDS,
};
