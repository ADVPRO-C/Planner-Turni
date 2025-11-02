import toast from "react-hot-toast";

// Map per tracciare i toast attivi e prevenire duplicati
const activeToasts = new Map();

// Genera un ID univoco per un toast basato sul tipo e messaggio
function generateToastId(type, message) {
  // Normalizza il messaggio per creare un ID più stabile (rimuove spazi extra, etc.)
  const normalizedMessage = message.trim().replace(/\s+/g, ' ');
  return `${type}_${normalizedMessage}`;
}

// Rimuove un toast dalla mappa quando viene chiuso
function handleDismiss(toastId) {
  activeToasts.delete(toastId);
}

// Intercetta la chiusura dei toast per aggiornare la mappa
const originalDismiss = toast.dismiss;
toast.dismiss = function(toastId) {
  if (toastId) {
    activeToasts.delete(toastId);
  } else {
    // Se dismiss è chiamato senza ID, rimuove tutti i toast
    activeToasts.clear();
  }
  return originalDismiss.apply(toast, arguments);
};

// Funzione wrapper per toast.success con anti-duplicati
export const toastSuccess = (message, options = {}) => {
  const toastId = options.id || generateToastId("success", message);
  
  // Se esiste già un toast con lo stesso ID, non crearlo di nuovo
  if (activeToasts.has(toastId)) {
    return activeToasts.get(toastId);
  }
  
  const toastInstance = toast.success(message, {
    id: toastId,
    duration: options.duration || 4000,
    ...options,
    // Assicura che il pulsante X sia sempre visibile
    dismissible: true,
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
  });
  
  // Traccia il toast
  activeToasts.set(toastId, toastInstance);
  
  // Rimuovi dalla mappa quando viene chiuso
  setTimeout(() => {
    handleDismiss(toastId);
  }, options.duration || 4000);
  
  return toastInstance;
};

// Funzione wrapper per toast.error con anti-duplicati
export const toastError = (message, options = {}) => {
  const toastId = options.id || generateToastId("error", message);
  
  // Se esiste già un toast con lo stesso ID, non crearlo di nuovo
  if (activeToasts.has(toastId)) {
    return activeToasts.get(toastId);
  }
  
  const toastInstance = toast.error(message, {
    id: toastId,
    duration: options.duration || 5000, // Errori durano di più
    ...options,
    dismissible: true,
    ariaProps: {
      role: 'alert',
      'aria-live': 'assertive',
    },
  });
  
  activeToasts.set(toastId, toastInstance);
  
  setTimeout(() => {
    handleDismiss(toastId);
  }, options.duration || 5000);
  
  return toastInstance;
};

// Funzione wrapper per toast.info con anti-duplicati
export const toastInfo = (message, options = {}) => {
  const toastId = options.id || generateToastId("info", message);
  
  if (activeToasts.has(toastId)) {
    return activeToasts.get(toastId);
  }
  
  const toastInstance = toast(message, {
    id: toastId,
    icon: 'ℹ️',
    duration: options.duration || 4000,
    ...options,
    dismissible: true,
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
  });
  
  activeToasts.set(toastId, toastInstance);
  
  setTimeout(() => {
    handleDismiss(toastId);
  }, options.duration || 4000);
  
  return toastInstance;
};

// Funzione wrapper per toast.loading con anti-duplicati
export const toastLoading = (message, options = {}) => {
  const toastId = options.id || generateToastId("loading", message);
  
  // Per i loading, se esiste già, aggiornalo invece di creare un duplicato
  if (activeToasts.has(toastId)) {
    toast.loading(message, {
      id: toastId,
      ...options,
    });
    return activeToasts.get(toastId);
  }
  
  const toastInstance = toast.loading(message, {
    id: toastId,
    duration: Infinity, // I loading toast devono essere chiusi manualmente
    ...options,
    dismissible: true,
  });
  
  activeToasts.set(toastId, toastInstance);
  
  return toastInstance;
};

// Funzione per aggiornare un toast (utile per loading -> success/error)
export const toastUpdate = (toastId, options) => {
  toast.dismiss(toastId);
  activeToasts.delete(toastId);
  
  // Crea un nuovo toast con le nuove opzioni
  if (options.type === 'success') {
    return toastSuccess(options.message, { id: toastId, ...options });
  } else if (options.type === 'error') {
    return toastError(options.message, { id: toastId, ...options });
  } else if (options.type === 'loading') {
    return toastLoading(options.message, { id: toastId, ...options });
  } else {
    return toastInfo(options.message, { id: toastId, ...options });
  }
};

// Funzione per chiudere un toast specifico
export const toastDismiss = (toastId) => {
  toast.dismiss(toastId);
  activeToasts.delete(toastId);
};

// Funzione per chiudere tutti i toast
export const toastDismissAll = () => {
  toast.dismiss();
  activeToasts.clear();
};

// Export anche la funzione toast originale per casi particolari
export { toast };

