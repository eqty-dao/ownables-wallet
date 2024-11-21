class ActivityLogService {

  activityLog: ActivityLog[];
  constructor() {
    this.activityLog =
      window.localStorage.getItem('activityLog') ?
        JSON.parse(window.localStorage.getItem('activityLog') || '[]') : [];
  }

  logActivity(activity: ActivityLog) {
    this.activityLog.push(activity);
    window.localStorage.setItem('activityLog', JSON.stringify(this.activityLog));
  }


  getAllLogs() {
    if (this.activityLog.length === 0) {
      //check if there is any activity log in local storage
      this.activityLog =
        window.localStorage.getItem('activityLog') ?
          JSON.parse(window.localStorage.getItem('activityLog') || '[]') : [];
    }
    return this.activityLog;
  }

}

export const activityLogService = new ActivityLogService();

export interface ActivityLog {
  activity: string;
  timestamp: number;
}
