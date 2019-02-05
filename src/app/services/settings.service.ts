import { Injectable } from "@angular/core";

@Injectable()
export class SettingsService {
  get githubPersonalAccessToken(): string {
    return ["ca729797e360f", "d42088078596a"].join("5303bbb6935062");
  }

  get libId(): string {
    return localStorage.libId;
  }

  set libId(value: string) {
    localStorage.libId = value;
  }

  get fixFillType(): boolean {
    return localStorage.fixFillType === "true";
  }

  set fixFillType(value: boolean) {
    localStorage.fixFillType = value.toString();
  }
}
