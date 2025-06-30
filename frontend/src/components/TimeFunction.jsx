export const formatDate = (isoDate) => {
  return new Date(isoDate).toLocaleString("vi-VN", {
    weekday: "long",
    // year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
