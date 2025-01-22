import { RequestOptions } from "../base.js";
import { CourseInfo, StudentInfo } from "../../fetcher/reg-cmu.js";
import { IRegClient } from "./base.js";
import { AxiosInstance, AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";
import { formatDays, formatExamDate, formatStartEndSec } from "../../helpers/reg-cmu.js";
import { IConfig } from "../../services/config.js";

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

export class AxiosRegClient implements IRegClient {
    private _instance: AxiosInstance;
    private _config: IConfig;
    constructor(instance: AxiosInstance) {
        this._instance = instance;
        // this._config = config;
    }
    
    private static _convertRequestOptions(options?: RequestOptions): AxiosRequestConfig {
        if (!options)
            return {}
        return {
            maxRedirects: options.manualRedirect ? 0 : -1,
            validateStatus: options.manualRedirect ? status => (status < 300 || status == 302) : undefined
        }
    }

    private async _getRegCourses(url: URL, options?: RequestOptions): Promise<RegCourse[]> {
        const resp = await this._instance.get(url.toString(), AxiosRegClient._convertRequestOptions(options));
        const $ = cheerio.load(resp.data);
        const $rows = $("table.table.table-bordered.table-striped.sortable tr");
        return $rows
            .filter((i, _) => !(i < 2 || i > $rows.length - 2)) // ignore 2 first rows and 1 last row
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

    public async getStudentInfo(url: URL, options?: RequestOptions): Promise<StudentInfo> {
        const resp = await this._instance.get(url.toString(), AxiosRegClient._convertRequestOptions(options));
        const $ = cheerio.load(resp.data);
        return {
            givenName: $("#mt > tbody > tr:nth-child(4) > td:nth-child(2)").text(),
            middleName: $("#mt > tbody > tr:nth-child(5) > td:nth-child(2)").text(),
            familyName: $("#mt > tbody > tr:nth-child(6) > td:nth-child(2)").text(),
            studentNo: parseInt($("#mt2 > tbody > tr:nth-child(1) > td:nth-child(2)").text())
        }
    }

    public async getCourses(url: URL, options?: RequestOptions): Promise<CourseInfo[]> {
        const courses = await this._getRegCourses(url, options);
        return courses.map(course => {
            return {
                courseNo: course.course_no,
                section: {
                    lec: course.lec_section,
                    lab: course.lab_section
                },
                title: course.title,
                schedule: {
                    days: formatDays(course.schedule_day),
                    midterm: formatExamDate(course.midterm_day, course.midterm_time),
                    final: formatExamDate(course.final_day, course.final_time),
                    ...formatStartEndSec(course.schedule_time)
                },
                credit: {
                    lec: parseInt(course.lec_credit),
                    lab: parseInt(course.lab_credit),
                }
            };
        });
    }
}
