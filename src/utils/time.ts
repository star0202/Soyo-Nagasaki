export const toTimestamp = (data: number | Date) =>
  ((data instanceof Date ? data.getTime() : data) / 1000).toFixed(0)
