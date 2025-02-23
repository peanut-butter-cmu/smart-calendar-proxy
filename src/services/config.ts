export interface IConfig {
    getSemesterPeriod(): Promise<{ start: Date, end: Date }>;
}

export class EnvConfig implements IConfig {
    async getSemesterPeriod(): Promise<{ start: Date; end: Date; }> {
        return {
            start: new Date(process.env.TEST_SEMESTER_START!),
            end: new Date(process.env.TEST_SEMESTER_END!)
        }
    }
}
