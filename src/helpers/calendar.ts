import { Priority } from "models/eventGroup.entity.js";
import { GroupTitle } from "../services/user.service.js";
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
    }
}

export function getDefaultPriority(title: GroupTitle) {
    switch(title) {
        case GroupTitle.ASSIGNMENT:
            return Priority.MEDIUM;
        case GroupTitle.CLASS:
            return Priority.MEDIUM;
        case GroupTitle.CMU:
            return Priority.MEDIUM;
        case GroupTitle.FINAL:
            return Priority.MEDIUM;
        case GroupTitle.HOLIDAY:
            return Priority.MEDIUM;
        case GroupTitle.MIDTERM:
            return Priority.MEDIUM;
        case GroupTitle.OWNER:
            return Priority.MEDIUM;
        case GroupTitle.QUIZ:
            return Priority.MEDIUM;
    }
}

export function getDefaultBusy(title: GroupTitle) {
    switch(title) {
        case GroupTitle.ASSIGNMENT:
            return true;
        case GroupTitle.CLASS:
            return true;
        case GroupTitle.CMU:
            return false;
        case GroupTitle.FINAL:
            return true;
        case GroupTitle.HOLIDAY:
            return false;
        case GroupTitle.MIDTERM:
            return true;
        case GroupTitle.OWNER:
            return true;
        case GroupTitle.QUIZ:
            return true;
    }
}

export function getDefaultReminders(title: GroupTitle) {
    switch(title) {
        case GroupTitle.ASSIGNMENT:
            return [0, 30];
        case GroupTitle.CLASS:
            return [15];
        case GroupTitle.CMU:
            return [];
        case GroupTitle.FINAL:
            return [30];
        case GroupTitle.HOLIDAY:
            return [];
        case GroupTitle.MIDTERM:
            return [30];
        case GroupTitle.OWNER:
            return [0];
        case GroupTitle.QUIZ:
            return [30];
    }
}
