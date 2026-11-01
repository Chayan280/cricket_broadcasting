const key = (role) => `cricket.pin.${role}`;

export const getPin = (role) => {
  try { return localStorage.getItem(key(role)) || ''; } catch { return ''; }
};
export const setPin = (role, pin) => {
  try { localStorage.setItem(key(role), pin); } catch { /* storage blocked */ }
};
export const clearPin = (role) => {
  try { localStorage.removeItem(key(role)); } catch { /* storage blocked */ }
};
