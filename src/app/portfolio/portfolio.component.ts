import { Component, inject, OnInit } from '@angular/core';
import { DataService, YourStocks } from '../data.service';
import { CommonModule } from '@angular/common';
import {
  combineLatest,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { StockComponent } from '../stock/stock.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, StockComponent],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  dataService = inject(DataService);
  yourStocks$ = this.dataService.yourStocks$;
  stockValue: Observable<number[]>;

  balance$ = this.dataService.balance$;
  marketValue: number;
  stockData: YourStocks;

  getCurrentPrice$ = this.yourStocks$.pipe(
    mergeMap((data: YourStocks[]) => {
      if (data.length === 0) {
        console.log('No stocks found.');
        return of([]);
      }
      const observables = data.map((stock) => {
        const params = {
          symbol: stock.symbol,
          token: this.dataService.pinhubApi,
        };
        return this.dataService.getCurrentPrice(params).pipe(
          map((data: any) => {
            stock.price = data.c;
            return stock;
          })
        );
      });
      return forkJoin(observables);
    }),
    map((stocks: YourStocks[]) => {
      const prices = stocks.map((stock) => stock.price * stock.amount);

      return prices;
    })
  );

  portfolioValue$ = combineLatest([this.getCurrentPrice$, this.balance$]).pipe(
    map(([stockPrices, balance]) => {
      if (stockPrices.length === 0) {
        return balance;
      }
      const totalStockValue = stockPrices.reduce(
        (acc, price) => acc + price,
        0
      );
      const portfolioValue = totalStockValue + balance;
      console.log('Total Stock Value:', totalStockValue);
      console.log('Portfolio Value:', portfolioValue);
      return portfolioValue;
    })
  );

  ngOnInit(): void {}
}
