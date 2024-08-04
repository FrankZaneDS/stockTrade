import { Component, inject, OnInit } from '@angular/core';
import { Company, DataService, newsResults, YourStocks } from '../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { combineLatest, map, Observable, shareReplay } from 'rxjs';
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
  wishlist$ = this.dataService.wishlist$;
  chartTab = true;
  newsTab = false;
  aboutTab = false;
  moreTab = false;
  companyDetails$: Observable<Company>;
  balance$ = this.dataService.balance$;
  disabledWishlist$: Observable<boolean>;
  disableButtonWishlist: boolean;
  price: number;
  amount: number = 1;
  buy: boolean = false;
  notEnough: boolean = false;

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
    borderColor: 'rgba(0, 0, 0, 0.1)',
  };
  chartTabs() {
    this.chartTab = true;
    this.newsTab = false;
    this.aboutTab = false;
    this.moreTab = false;
  }
  newsTabs() {
    this.chartTab = false;
    this.newsTab = true;
    this.aboutTab = false;
    this.moreTab = false;
  }
  aboutTabs() {
    this.chartTab = false;
    this.newsTab = false;
    this.aboutTab = true;
    this.moreTab = false;
  }
  moreTabs() {
    this.chartTab = false;
    this.newsTab = false;
    this.aboutTab = false;
    this.moreTab = true;
    console.log(this.moreTab);
  }

  onSymbolChange(symbol: string) {
    this.router.navigate([], { queryParams: { symbol } });
    this.getCompanyDetails();
    this.getSevenDays();
    this.disabledWishlist$ = combineLatest([
      this.wishlist$,
      this.companyDetails$,
    ]).pipe(
      map(([wishlist, details]) => {
        this.disableButtonWishlist = this.checkCommonValues(wishlist, details);
        return !this.disableButtonWishlist;
      })
    );
  }
  checkCommonValues(wishlist: YourStocks[], details: Company) {
    return wishlist.some((stock) => {
      return stock.name === details.name;
    });
  }
  getStockPrice() {
    const params = {
      symbol: this.stockSymbol.toUpperCase(),
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
    this.newsArticle$ = this.dataService
      .getNews(this.stockSymbol.toUpperCase())
      .pipe(
        map((data) => {
          return data['results'];
        })
      );
  }

  getCompanyDetails() {
    this.companyDetails$ = this.dataService
      .getCompanyDetails(this.stockSymbol.toUpperCase())
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
        this.stockSymbol.toUpperCase(),
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
        this.stockSymbol.toUpperCase(),
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
        this.stockSymbol.toUpperCase(),
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
  addToWishlist(name: string, ticker: string, price: number, desc: string) {
    const wishlist: YourStocks[] = this.dataService.wishlist$.getValue();
    const stock: YourStocks = {
      name,
      symbol: ticker,
      price,
      amount: 1,
      totalCost: null,
      wishlist: true,
      description: desc,
    };
    wishlist.push(stock);
    this.dataService.wishlist$.next(wishlist);
  }

  onBuy(name: string, ticker: string, price: number, yourStocks: YourStocks[]) {
    let yourStock: YourStocks;

    // Dobavljanje trenutne cene

    const oldBalance = this.balance$.getValue();
    const newBalance = oldBalance - price * this.amount;

    if (newBalance < 0) {
      console.log('Insufficient funds.');
      this.notEnough = true;
      setTimeout(() => {
        this.notEnough = false;
      }, 2000);

      return; // Prekini lanac ako nema dovoljno sredstava
    }

    // Ažuriranje balansa
    this.balance$.next(newBalance);

    // Kreiranje objekta za kupovinu akcija
    yourStock = {
      name,
      amount: this.amount,
      symbol: ticker,
      price,
      totalCost: price * this.amount,
      wishlist: false,
      description: null,
      // currentValue: price * amount,
    };

    // Emitovanje novih akcija

    const existingStockIndex = yourStocks.findIndex(
      (stock) => stock.symbol === yourStock.symbol
    );

    if (existingStockIndex !== -1) {
      // Ako već postoji, povećaj količinu
      yourStocks[existingStockIndex].amount += this.amount;
      yourStocks[existingStockIndex].totalCost += this.amount * price;
    } else {
      // Inače, dodaj novu akciju
      yourStocks.push(yourStock);
    }

    this.buy = true;
    setTimeout(() => {
      this.buy = false;
    }, 2000);

    this.dataService.yourStocks$.next(yourStocks);
    this.amount = 1;
  }
  closeBtn() {
    this.amount = 1;
  }
  ngOnInit(): void {}
}
//moment.js
//interseptor za dodavanje tokena uz svaki poziv
