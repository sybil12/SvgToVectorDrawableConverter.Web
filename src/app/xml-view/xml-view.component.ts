import { Component, Input, ElementRef, ViewChild } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as FileSaver from 'file-saver';
import { StatsService } from '../services/stats.service';
import { PreviewComponent } from '../preview/preview.component';

@Component({
  selector: 'app-xml-view',
  templateUrl: './xml-view.component.html',
  styleUrls: ['./xml-view.component.css'],
  animations: [
    trigger('alertState', [
      state('*, hidden', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('* => *', animate(200))
    ])
  ]
})
export class XmlViewComponent {
  @ViewChild('imagePreview') imagePreview: PreviewComponent;

  @Input() title: string;
  hidePreview: boolean;
  copyCodeAlertState = '';

  private _xml: string;

  get xml (): string {
    return this.hidePreview ? null : this._xml;
  }

  @Input()
  set xml (value: string) {
    this.hidePreview = value && value.length > 500000;
    this._xml = value;
    this._imagePreviewExpanded = false;
  }

  private _imagePreviewExpanded: boolean;

  get imagePreviewExpanded () {
    return this._imagePreviewExpanded;
  }

  set imagePreviewExpanded (value) {
    if (this._imagePreviewExpanded) {
      return;
    }
    this.imagePreview.load(this._xml);
    this._imagePreviewExpanded = value;

    this._stats.event({ 'xml-view.expand-image-preview': this._stats.noValue });
  }

  private _timeoutId;

  constructor (
    private readonly _stats: StatsService,
    private readonly _element: ElementRef
  ) { }

  showPreview () {
    this.hidePreview = false;

    this._stats.event({ 'xml-view.show-preview': this._stats.noValue });
  }

  saveToFile () {
    FileSaver.saveAs(new Blob([this._xml], { type: 'text/xml;charset=utf-8' }), this.title, true);

    this._stats.event({ 'xml-view.save-to-file': this._stats.noValue });
  }

  copyCode () {
    const ta = document.createElement('textarea');
    ta.style.position = 'fixed';
    ta.style.left = '0';
    ta.style.top = '0';
    ta.style.opacity = '0';
    ta.value = this._xml;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);

    clearTimeout(this._timeoutId);
    this.copyCodeAlertState = 'visible';
    this._timeoutId = setTimeout(() => {
      this.copyCodeAlertState = 'hidden';
    }, 2000);

    this._stats.event({ 'xml-view.copy-code': this._stats.noValue });
  }

  openIssue () {
    this._element.nativeElement.dispatchEvent(new Event('openIssueClick', { 'bubbles': true }));

    this._stats.event({ 'xml-view.open-issue': this._stats.noValue });
  }
}
