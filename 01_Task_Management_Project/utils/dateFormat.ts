import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatRelative = (date: string) => {
  return dayjs(date).fromNow();
};