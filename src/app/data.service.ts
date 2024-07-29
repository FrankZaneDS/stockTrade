import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiKey = 'YAUtp_t1wTdL7oVD7oAGRqrouqqv8K4G';
  private baseUrl = 'https://api.polygon.io/v2';
  pinhubApi = 'cqch419r01qoodgbfbk0cqch419r01qoodgbfbkg';
  private pinhubUrl = 'https://finnhub.io/api/v1/quote';

  balance$ = new BehaviorSubject<number>(100000);
  yourStocks$ = new BehaviorSubject<YourStocks[]>([]);

  http = inject(HttpClient);
  currentPrice$ = new Observable<number>();

  getCurrentPrice(params: Params): Observable<any> {
    // const params = new HttpParams()
    //   .set('symbol', symbol)
    //   .set('token', this.pinhubApi);

    return this.http.get<any>(this.pinhubUrl, { params });
  }

  getNews(symbol: string): Observable<any[]> {
    const params = new HttpParams()
      .set('ticker', symbol)
      .set('apiKey', this.apiKey);

    return this.http.get<any>(`${this.baseUrl}/reference/news`, { params });
  }

  getCompanyDetails(symbol: string): Observable<any> {
    const params = new HttpParams()
      .set('ticker', symbol)
      .set('apiKey', this.apiKey);

    return this.http.get<any>(
      `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=YAUtp_t1wTdL7oVD7oAGRqrouqqv8K4G`,
      { params }
    );
  }
  getHistoricalPrices(
    symbol: string,
    from: string,
    to: string
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('from', from)
      .set('to', to)
      .set('sort', 'asc');

    return this.http
      .get<any>(
        `${this.baseUrl}/aggs/ticker/${symbol}/range/1/day/${from}/${to}`,
        { params }
      )
      .pipe(map((data) => data.results));
  }
}
export interface current {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}
export interface newsResults {
  id: string;
  publisher: Publisher;
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  tickers: string[];
  image_url: string;
  description: string;
  keywords: string[];
  insights: Insight[];
}

export interface Publisher {
  name: string;
  homepage_url: string;
  logo_url: string;
  favicon_url: string;
}

export interface Insight {
  ticker: string;
  sentiment: string;
  sentiment_reasoning: string;
}
export interface Company {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik: string;
  composite_figi: string;
  share_class_figi: string;
  market_cap: number;
  phone_number: string;
  address: Address;
  description: string;
  sic_code: string;
  sic_description: string;
  ticker_root: string;
  homepage_url: string;
  list_date: string;
  branding: Branding;
  share_class_shares_outstanding: number;
  weighted_shares_outstanding: number;
  round_lot: number;
}

export interface Address {
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface Branding {
  logo_url: string;
}
export interface YourStocks {
  name: string;
  amount: number;
  symbol: string;
  price: number;
  totalCost: number;
}
