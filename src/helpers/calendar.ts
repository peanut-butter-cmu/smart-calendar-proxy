import { GroupTitle } from "../services/user/index.js";
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

export function getDefaultColor(title: GroupTitle | string) {
    switch (title) {
        case GroupTitle.ASSIGNMENT:
            return "rgb(252, 205, 42)";
        case GroupTitle.CLASS:
            return "rgb(65, 179, 162)";
        case GroupTitle.CMU:
            return "rgb(97, 94, 252)";
        case GroupTitle.FINAL:
            return "rgb(255, 0, 0)";
        case GroupTitle.MIDTERM:
            return "rgb(255, 0, 0)";
        case GroupTitle.HOLIDAY:
            return "rgb(255, 255, 255)";
        case GroupTitle.OWNER:
            return "rgb(255, 255, 255)";
        case GroupTitle.QUIZ:
            return "rgb(255, 145, 0)";
        default:
            return "rgb(255, 255, 255)";
    }
}
