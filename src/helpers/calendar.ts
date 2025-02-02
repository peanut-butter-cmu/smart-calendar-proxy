import dayjs from "dayjs";

export function createStartEndInRegDate(date: Date, startSec: number, endSec: number) {  
    function addBy(sec: number) {
        return dayjs(date).add(sec, "s").toDate();
    }
    return {
        start: addBy(startSec),
        end: addBy(endSec)
    }
}
