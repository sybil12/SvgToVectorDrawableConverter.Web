import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { SettingsService } from '../services/settings.service';
import { StatsService } from '../services/stats.service';
import { stringify } from 'query-string';
import * as JSZip from 'jszip';

export interface ReportIssueData {
  svgName: string;
  svgContent: string;
  target: string;
  fixFillType: string;
  userAgent: string;
  browserLanguage: string;
  additionalInformation: string;
}

export class ReportIssueRequest {
  constructor (
    readonly data: ReportIssueData,
    private readonly _httpClient: HttpClient,
    private readonly _settings: SettingsService,
    private readonly _stats: StatsService
  ) { }

  issueUrl: string | null;
  errorMessage: string | null;
  autoRetryAt: number | null;

  private readonly _error = new Subject();

  error () {
    return this._error.asObservable();
  }

  success () {
    return this._error.isStopped;
  }

  loading = false;

  private _timeoutId;

  async load () {
    clearTimeout(this._timeoutId);
    this._timeoutId = undefined;

    if (this.success() || this.loading) { return; }
    this.loading = true;

    const issueBody = await this.getIssueBody();
    this._httpClient.post('https://api.github.com/repos/a-student/SvgToVectorDrawableConverter.Web/issues',
      { 'title': this.getIssueTitle(), 'body': issueBody },
      { 'params': new HttpParams().set('access_token', this._settings.githubPersonalAccessToken) }
    )
      .subscribe(
        x => {
          this.issueUrl = x['html_url'];
          this.errorMessage = null;
          this.autoRetryAt = null;

          this.loading = false;
          this._error.complete();

          this._stats.event({ 'report-issue.load:status': 'success' });
        },
        (e: HttpErrorResponse) => {
          this.issueUrl = null;
          this.errorMessage = (e.error ? e.error.message : null) || e.statusText;

          const now = new Date().getTime();
          const rateLimitRemaining = parseInt(e.headers.get('X-RateLimit-Remaining'));
          const rateLimitResetAt = parseInt(e.headers.get('X-RateLimit-Reset')) * 1000;
          this.autoRetryAt = rateLimitRemaining <= 0 && rateLimitResetAt > now ? rateLimitResetAt : now + 60 * 1000;

          this.loading = false;
          this._timeoutId = setTimeout(this.load.bind(this), this.autoRetryAt - now);
          this._error.next();

          this._stats.event({ 'report-issue.load:status': e.status });
        });
  }

  private getIssueTitle () {
    return `Conversion issue with '${this.data.svgName}'`;
  }

  private async getIssueBody () {
    let body = `_SVG name:_ \`${this.data.svgName}\`\n\n` +
      `_Target:_ \`${this.data.target}\`\n\n` +
      `_Fix fill type:_ \`${this.data.fixFillType}\`\n\n` +
      `_User agent:_ \`${this.data.userAgent}\`\n\n` +
      `_Browser language:_ \`${this.data.browserLanguage}\`\n\n` +
      `<details><summary>SVG content</summary>\n\n\`\`\`SVG\n${this.data.svgContent}\n\`\`\`\n\n</details><br>\n`;
    const base64 = await this.zipSvg();
    if (base64.length < 8000) {
      const baseUrl = location.href.replace(location.search, '');
      const actionSaveFileUrl = baseUrl + '?' + stringify({ 'action-save-file': base64 });
      const actionConvertUrl = baseUrl + '?' + stringify({ 'action-convert': base64 });
      body += `\n[Save SVG file](${actionSaveFileUrl}) | [Convert SVG](${actionConvertUrl})\n`;
    }
    if (this.data.additionalInformation) {
      body += `\n${this.data.additionalInformation}\n`;
    }
    return body;
  }

  private async zipSvg () {
    const zip = new JSZip();
    zip.file(this.data.svgName, this.data.svgContent);
    return await zip.generateAsync({ type: 'base64', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  }
}
