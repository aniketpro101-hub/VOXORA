export const WHATSAPP_LIMITS = {
  FILES: {
    IMAGE: {
      maxSize: 5 * 1024 * 1024, // 5 MB
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      recommendedSize: 2 * 1024 * 1024, // 2 MB recommended
    },
    VIDEO: {
      maxSize: 16 * 1024 * 1024, // 16 MB
      maxSizeMB: 16,
      allowedTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/3gpp', 'video/webm'],
      allowedExtensions: ['.mp4', '.mov', '.avi', '.3gp', '.webm'],
      recommendedSize: 10 * 1024 * 1024, // 10 MB
    },
    AUDIO: {
      maxSize: 16 * 1024 * 1024, // 16 MB
      maxSizeMB: 16,
      allowedTypes: ['audio/mpeg', 'audio/mp3', 'audio/aac', 'audio/ogg', 'audio/mp4', 'audio/amr', 'audio/opus', 'audio/wav'],
      allowedExtensions: ['.mp3', '.aac', '.ogg', '.m4a', '.amr', '.opus', '.wav'],
      recommendedSize: 5 * 1024 * 1024, // 5 MB
    },
    DOCUMENT: {
      maxSize: 100 * 1024 * 1024, // 100 MB
      maxSizeMB: 100,
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-zip-compressed',
      ],
      allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip'],
      recommendedSize: 20 * 1024 * 1024, // 20 MB
    },
    STICKER: {
      maxSize: 100 * 1024, // 100 KB
      maxSizeMB: 0.1,
      allowedTypes: ['image/webp'],
      allowedExtensions: ['.webp'],
      recommendedSize: 50 * 1024, // 50 KB
    },
  },

  MESSAGES: {
    TEXT: {
      maxLength: 4096,
      recommendedLength: 1000,
      minLength: 1,
    },
    TEXT_WITH_BUTTONS: {
      bodyMaxLength: 1024,
      footerMaxLength: 60,
      recommendedBodyLength: 500,
    },
    CAPTION: {
      maxLength: 1024,
      recommendedLength: 250,
    },
    BUTTON: {
      textMaxLength: 20,
      maxButtons: 3,
      recommendedButtons: 2,
    },
    LIST: {
      titleMaxLength: 60,
      descriptionMaxLength: 72,
      rowTitleMaxLength: 24,
      buttonTextMaxLength: 20,
      maxSections: 10,
      maxTotalRows: 10,
      headerMaxLength: 60,
    },
    CAROUSEL: {
      maxCards: 10,
      cardTitleMaxLength: 100,
      cardBodyMaxLength: 200,
      cardButtonsMax: 2,
    },
  },

  RATE_LIMITS: {
    PER_SECOND: 1,
    PER_MINUTE: 60,
    PER_HOUR: 200,
    PER_DAY_NEW_ACCOUNT: 100,
    PER_DAY_ESTABLISHED: 500,
    PER_DAY_VETERAN: 1000,
  },

  STORAGE: {
    RETENTION_HOURS: 48,
    RETENTION_MESSAGES_DAYS: 30,
    MAX_FILES_PER_USER: 100,
    MAX_TOTAL_STORAGE_MB: 500, // 500 MB per user
  },
};
