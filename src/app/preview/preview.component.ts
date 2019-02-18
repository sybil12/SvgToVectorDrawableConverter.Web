import { Component, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnDestroy {
  state: State;
  readonly stateEnum = State;

  src: SafeUrl;
  errorMessage: string;

  constructor (
    private readonly _httpClient: HttpClient,
    private readonly _sanitizer: DomSanitizer
  ) { }

  private _xml: string;
  private _url: string;

  public load (xml: string) {
    this._xml = xml;

    if (location.protocol.toLowerCase() !== 'http:') {
      this.state = State.Http;
      return;
    }

    this.state = State.Loading;
    this._httpClient.post('http://193.124.64.166/preview', xml, { responseType: 'blob' })
      .subscribe(
        x => {
          if (this._url) {
            URL.revokeObjectURL(this._url);
          }
          this._url = URL.createObjectURL(x);
          this.src = this._sanitizer.bypassSecurityTrustUrl(this._url);
          this.state = State.Ok;
        },
        (e: HttpErrorResponse) => {
          this.errorMessage = e.statusText;
          this.state = State.Error;
        });
  }

  ngOnDestroy (): void {
    if (this._url) {
      URL.revokeObjectURL(this._url);
    }
  }

  public switchToHttp () {
    location.href = 'http:' + location.href.substring(location.protocol.length);
  }

  public retry () {
    this.load(this._xml);
  }
}

enum State {
  Http,
  Loading,
  Ok,
  Error
}
