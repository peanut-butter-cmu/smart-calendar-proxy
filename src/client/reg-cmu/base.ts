import { RequestOptions } from "../base.js";
import { CourseInfo, StudentInfo } from "../../fetcher/reg-cmu.js";

export interface IRegClient {
    getStudentInfo(url: URL, options?: RequestOptions): Promise<StudentInfo>;
    getCourses(url: URL, options?: RequestOptions): Promise<CourseInfo[]>;
}