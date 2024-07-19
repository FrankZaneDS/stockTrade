import { Component, inject, OnInit } from '@angular/core';
import { Company, DataService, newsResults, YourStocks } from '../data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { EMPTY, first, map, Observable, switchMap, take } from 'rxjs';
import { RouterLink } from '@angular/router';

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
  stockData: any;
  stockSymbol: string = 'AAPL';
  dataService = inject(DataService);
  stockPrice: number;
  changePercent: any;
  currentPrice$ = this.dataService.currentPrice$;
  changePerc$ = new Observable<number>();
  newsArticle$ = new Observable<newsResults[]>();
  showTab = true;
  companyDetails: Company;
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
  onSymbolChange(newSymbol: string) {
    this.stockSymbol = newSymbol;
    this.getStockPrice();
    this.getNews();
    this.getCompanyDetails();
    this.getSevenDays();
  }

  getStockPrice() {
    this.currentPrice$ = this.dataService
      .getCurrentPrice(this.stockSymbol)
      .pipe(
        map((data) => {
          return Number(data.c);
        })
      );
    this.changePerc$ = this.dataService.getCurrentPrice(this.stockSymbol).pipe(
      map((data) => {
        return Number(data.dp);
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
    this.dataService
      .getCompanyDetails(this.stockSymbol)
      .pipe(map((data) => data.results))
      .subscribe((data) => (this.companyDetails = data));
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
  // onBuy(amount: number) {
  //   let value: number;
  //   this.currentPrice$.subscribe((data) => {
  //     console.log(data);
  //     setTimeout(() => {
  //       value = data;
  //       console.log(value);
  //       const oldBalance = this.balance$.getValue();
  //       const newBalance = oldBalance - Number(value) * amount;
  //       this.balance$.next(newBalance);
  //       console.log(newBalance);

  //       const yourStock: YourStocks = {
  //         name: this.companyDetails.name,
  //         amount: amount,
  //         symbol: this.companyDetails.ticker,
  //         price: value,
  //         totalCost: value * amount,
  //       };
  //       let oldStocks: YourStocks[] = [];

  //       this.dataService.yourStocks$.subscribe((data) => {
  //         oldStocks = data;
  //         console.log(data);
  //       });
  //       oldStocks.map((data) => {
  //         if (data.name == yourStock.name) {
  //           data.amount = yourStock.amount +1;
  //           console.log('sdfd');
  //         } else {
  //           oldStocks.push(yourStock);
  //           console.log('dsds');
  //         }
  //       });
  //       console.log(oldStocks);
  //       this.dataService.yourStocks$.next(oldStocks);
  //     }, 2000);
  //   });
  // }
  onBuy(amount: number) {
    let yourStock: YourStocks;

    // Dobavljanje trenutne cene
    this.currentPrice$
      .pipe(
        first(), // uzimamo samo prvu vrednost jer nas samo prva cena zanima za kupovinu
        switchMap((data: number) => {
          const value = data;
          const oldBalance = this.balance$.getValue();
          const newBalance = oldBalance - Number(value) * amount;

          if (newBalance < 0) {
            console.error('Insufficient funds.');
            return EMPTY; // Prekini lanac ako nema dovoljno sredstava
          }

          // Ažuriranje balansa
          this.balance$.next(newBalance);

          // Kreiranje objekta za kupovinu akcija
          yourStock = {
            name: this.companyDetails.name,
            amount: amount,
            symbol: this.companyDetails.ticker,
            price: value,
            totalCost: value * amount,
          };

          // Emitovanje novih akcija
          return this.dataService.yourStocks$.pipe(
            take(1), // uzimamo samo prvu vrednost
            map((oldStocks: YourStocks[]) => {
              const existingStockIndex = oldStocks.findIndex(
                (stock) => stock.symbol === yourStock.symbol
              );

              if (existingStockIndex !== -1) {
                // Ako već postoji, povećaj količinu
                oldStocks[existingStockIndex].amount += amount;
                oldStocks[existingStockIndex].totalCost += amount * value;
              } else {
                // Inače, dodaj novu akciju
                oldStocks.push(yourStock);
              }

              return oldStocks;
            })
          );
        })
      )
      .subscribe(
        (updatedStocks: YourStocks[]) => {
          // Emitovanje ažuriranih akcija
          this.dataService.yourStocks$.next(updatedStocks);
          console.log('Stocks updated:', updatedStocks);
        },
        (error) => {
          console.error('Error buying stocks:', error);
        }
      );
  }

  ngOnInit(): void {
    this.getStockPrice();
    this.getNews();
    this.getCompanyDetails();
    this.getSevenDays();

    // this.currentPrice$.subscribe((data) => console.log(data));
  }
}
