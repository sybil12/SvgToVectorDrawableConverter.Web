import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ReportIssueRequest, ReportIssueData } from './ReportIssueRequest';
import { SettingsService } from '../services/settings.service';
import { StatsService } from '../services/stats.service';
import 'rxjs/add/operator/finally';

@Injectable({
  providedIn: 'root'
})
export class ReportIssueService {
  private readonly _open = new Subject<{ svgName: string, svgContent: string }>();
  private readonly _report = new Subject<ReportIssueRequest>();

  private readonly _pendingRequests = new Array<ReportIssueData>();

  open () {
    return this._open.asObservable();
  }

  report () {
    return this._report.asObservable();
  }

  openIssue (svgName: string, svgContent: string) {
    this._open.next({ svgName, svgContent });

    this._stats.event({ 'report-issue.open-issue': this._stats.noValue });
  }

  constructor (
    private readonly _httpClient: HttpClient,
    private readonly _settings: SettingsService,
    private readonly _stats: StatsService
  ) { }

  reportPendingIssues () {
    const reportIssuePendingRequests = localStorage.getItem('reportIssuePendingRequests');
    if (reportIssuePendingRequests) {
      JSON.parse(reportIssuePendingRequests).forEach(x => this.reportIssue(x));
    }
  }

  private savePendingRequests () {
    const reportIssuePendingRequests = JSON.stringify(this._pendingRequests);
    localStorage.setItem('reportIssuePendingRequests', reportIssuePendingRequests);
  }

  reportIssue (data: ReportIssueData) {
    const request = new ReportIssueRequest(
      data,
      this._httpClient,
      this._settings,
      this._stats
    );
    this._pendingRequests.push(data);
    this.savePendingRequests();
    request.error()
      .finally(() => {
        this._pendingRequests.remove(data);
        this.savePendingRequests();
      })
      .subscribe();
    this._report.next(request);
    request.load();
  }
}
