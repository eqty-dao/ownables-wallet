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
    const _ = this.activityLog;
    //sort the logs by timestamp
    _.sort((a, b) => b.timestamp - a.timestamp);
    return _;
  }

}

export const activityLogService = new ActivityLogService();

export interface ActivityLog {
  activity: string;
  timestamp: number;
}
