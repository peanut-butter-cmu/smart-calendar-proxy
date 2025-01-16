import { KyInstance, Options } from "ky";
import { RequestOptions } from "./base.js";
import { OAuthState, REGPayload } from "../fetcher/reg-cmu.js";
import { CalendarEvent, CalendarEventType } from "../models/event.js";
import { RegClient } from "./reg-cmu.js";
import ky from "ky";
import * as cheerio from "cheerio";
import { Repository } from "../repositories/base.js";
import { courseScheduleDates as scheduleToDate } from "../helpers/reg-cmu.js";

export type RegCourse = {
    course_no: string;
    title: string;
    lec_section: string;
    lab_section: string;
    lec_credit: string;
    lab_credit: string;
    schedule_day: string;
    schedule_time: string;
    type: string;
    midterm_day: string;
    midterm_time: string;
    final_day: string;
    final_time: string;
}

export class KyRegClient implements RegClient {
    private _instance: KyInstance;
    private _repo: Repository;
    constructor(repo: Repository) {
        this._instance = ky.extend({});
        this._repo = repo;
    }

    private static _convertRequestOptions(options?: RequestOptions): Options {
        if (!options)
            return {}
        return {
            redirect: !options.redirect ? "manual" : "follow"
        }
    }

    async getOAuthState(url: URL, options?: RequestOptions): Promise<OAuthState> {
        const txt = await this._instance
            .get(url, KyRegClient._convertRequestOptions(options))
            .text();
        const $ = cheerio.load(txt);
        return {
            viewState: $("input#__VIEWSTATE").val()?.toString() || "",
            viewStateGenerator: $("input#__VIEWSTATE").val()?.toString() || "",
            eventValidation: $("input#__EVENTVALIDATION").val()?.toString() || ""
        }
    }

    private async getRegCourses(url: URL, options?: RequestOptions): Promise<RegCourse[]> {
        const txt = await this._instance
            .get(url, KyRegClient._convertRequestOptions(options))
            .text();
        const $ = cheerio.load(txt);
        const $rows = $("table.table.table-bordered.table-striped.sortable tr");
        
        return $rows
            .filter((i, _) => i < 2 || i > $rows.length - 2) // ignore 2 first rows and 1 last row
            .map((_, row) => {
                function get_col_txt(idx: number) {
                    return $(row)
                        .find(`td:eq(${idx})`)
                        .text()
                        .trim();
                }
                return {
                    course_no: get_col_txt(1),
                    title: get_col_txt(2),
                    lec_section: get_col_txt(3),
                    lab_section: get_col_txt(4),
                    lec_credit: get_col_txt(5),
                    lab_credit: get_col_txt(6),
                    schedule_day: get_col_txt(7),
                    schedule_time: get_col_txt(8),
                    type: get_col_txt(9),
                    midterm_day: get_col_txt(11),
                    midterm_time: get_col_txt(12),
                    final_day: get_col_txt(13),
                    final_time: get_col_txt(14)
                }
            })
            .toArray()
    }

    async getCalendarEvents(url: URL, options?: RequestOptions): Promise<CalendarEvent[]> {
        const courses = await this.getRegCourses(url, options);
        const semester = await this._repo.getSemesterPeriod();
        return courses.map(
            course => scheduleToDate(course.schedule_day, course.schedule_time, semester)
            .map(({ start, end }) => ({
                title: course.title,
                start,
                end
            }))
        ).flat().map(event => ({
            type: CalendarEventType.Class,
            ...event
        }));
    }

    postOAuthState(url: URL, body: REGPayload, options?: RequestOptions): Promise<OAuthState> {
        throw new Error("Method not implemented.");
    }

    postURL(url: URL, body: REGPayload, options?: RequestOptions): Promise<URL> {
        throw new Error("Method not implemented.");
    }
    
}