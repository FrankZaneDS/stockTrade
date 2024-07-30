import { Component, inject, OnInit } from '@angular/core';
import { Company, DataService, newsResults, YourStocks } from '../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { map, Observable, shareReplay } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import moment from 'moment';
@Component({
  selector: 'app-first-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    BaseChartDirective,
    RouterLink,
  ],
  templateUrl: './first-page.component.html',
  styleUrls: ['./first-page.component.css'],
})
export class FirstPageComponent implements OnInit {
  dataService = inject(DataService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  currentDate: moment.Moment = moment();
  yourStock$ = this.dataService.yourStocks$;
  data$: Observable<any>;
  stockSymbol: string = this.route.snapshot.params.symbol;
  stockPrice: number;
  changePercent: any;
  currentPrice$: Observable<number>;
  changePerc$ = new Observable<number>();
  newsArticle$ = new Observable<newsResults[]>();
  showTab = true;
  companyDetails$: Observable<Company>;
  balance$ = this.dataService.balance$;

  price: number;

  historicalData: any = {
    last7Days: [],
    lastMonth: [],
    last6Months: [],
  };

  sevenDays = true;
  month = false;
  lastSix = false;
  date: string = '';

  lineChartData = [
    { data: this.historicalData.last7Days, label: this.date },
    { data: this.historicalData.lastMonth, label: 'Last Month' },
    { data: this.historicalData.last6Months, label: 'Last 6 Months' },
  ];
  lineChartLabels: string[] = [];
  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };
  showTabs() {
    this.showTab = true;
  }
  hideTab() {
    this.showTab = false;
  }
  onSymbolChange(symbol: string) {
    this.router.navigate([], { queryParams: { symbol } });
    this.getCompanyDetails();
    this.getSevenDays();
  }

  getStockPrice() {
    const params = {
      symbol: this.stockSymbol,
      token: this.dataService.pinhubApi,
    };
    this.data$ = this.dataService
      .getCurrentPrice(params)
      .pipe(shareReplay({ refCount: true }));

    this.currentPrice$ = this.data$.pipe(
      map((data) => {
        return +data.c;
      })
    );
    this.changePerc$ = this.data$.pipe(
      map((data) => {
        return +data.dp;
      })
    );
  }

  getNews() {
    this.newsArticle$ = this.dataService.getNews(this.stockSymbol).pipe(
      map((data) => {
        return data['results'];
      })
    );
  }

  getCompanyDetails() {
    this.companyDetails$ = this.dataService
      .getCompanyDetails(this.stockSymbol)
      .pipe(map((data) => data.results));
    this.getStockPrice();
    this.getNews();
  }

  getSevenDays() {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    this.dataService
      .getHistoricalPrices(
        this.stockSymbol,
        formatDate(last7Days),
        formatDate(today)
      )
      .subscribe((data) => {
        this.historicalData.last7Days = data.map((d) => d.c);
        this.lineChartData[0].data = this.historicalData.last7Days;
        this.lineChartLabels = data.map((d) =>
          new Date(d.t).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        );
        this.date = 'Last Seven Days';
      });
  }

  getMonth() {
    const today = new Date();
    this.date = 'Last Month';
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    this.dataService
      .getHistoricalPrices(
        this.stockSymbol,
        formatDate(lastMonth),
        formatDate(today)
      )
      .subscribe((data) => {
        this.historicalData.lastMonth = data.map((d) => d.c);

        this.lineChartData[0].data = this.historicalData.lastMonth;
        this.lineChartLabels = data.map((d) =>
          new Date(d.t).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        );
      });
  }

  getSixMonths() {
    const today = new Date();
    this.date = 'Last Six Months';
    const last6Months = new Date(today);
    last6Months.setMonth(today.getMonth() - 6);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    this.dataService
      .getHistoricalPrices(
        this.stockSymbol,
        formatDate(last6Months),
        formatDate(today)
      )
      .subscribe((data) => {
        this.historicalData.last6Months = data.map((d) => d.c);
        this.lineChartData[0].data = this.historicalData.last6Months;
        this.lineChartLabels = data.map((d) =>
          new Date(d.t).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        );
      });
  }

  onBuy(
    amount: number,
    name: string,
    ticker: string,
    price: number,
    yourStocks: YourStocks[]
  ) {
    let yourStock: YourStocks;

    // Dobavljanje trenutne cene

    const oldBalance = this.balance$.getValue();
    const newBalance = oldBalance - price * amount;

    if (newBalance < 0) {
      console.error('Insufficient funds.');
      return; // Prekini lanac ako nema dovoljno sredstava
    }

    // Ažuriranje balansa
    this.balance$.next(newBalance);

    // Kreiranje objekta za kupovinu akcija
    yourStock = {
      name,
      amount,
      symbol: ticker,
      price,
      totalCost: price * amount,
      // currentValue: price * amount,
    };

    // Emitovanje novih akcija

    const existingStockIndex = yourStocks.findIndex(
      (stock) => stock.symbol === yourStock.symbol
    );

    if (existingStockIndex !== -1) {
      // Ako već postoji, povećaj količinu
      yourStocks[existingStockIndex].amount += amount;
      yourStocks[existingStockIndex].totalCost += amount * price;
    } else {
      // Inače, dodaj novu akciju
      yourStocks.push(yourStock);
    }

    this.dataService.yourStocks$.next(yourStocks);
  }

  ngOnInit(): void {}
}
//moment.js
//interseptor za dodavanje tokena uz svaki poziv
