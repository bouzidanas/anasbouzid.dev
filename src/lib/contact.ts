export const email = "anasbouzid@gmail.com";

const subject = "Résumé request";
const body = "Hi Anas,\n\nCould you send me your current résumé? I'm reaching out about:\n\n";

export const resumeRequest = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
