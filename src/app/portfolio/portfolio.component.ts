import { Component, inject, OnInit } from '@angular/core';
import { DataService, YourStocks } from '../data.service';
import { CommonModule } from '@angular/common';
import {
  BehaviorSubject,
  flatMap,
  forkJoin,
  map,
  mergeMap,
  switchMap,
} from 'rxjs';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  dataService = inject(DataService);
  yourStocks = this.dataService.yourStocks$;

  balance$ = this.dataService.balance$;
  marketValue: number;
  stockData: YourStocks;
  price: number;

  // getCurrentPrice() {
  //   let stock: YourStocks;
  //   let newStocks: YourStocks[] = [];

  //   this.yourStocks
  //     .pipe(
  //       map((data: YourStocks[]) => {
  //         data.map((data) => (stock = data));
  //       })
  //     )
  //     .subscribe((data) => data);
  //     this.dataService.yourStocks$.subscribe((data) => {
  //       newtStocks = data;
  //       console.log(data);
  //     });
  //   this.dataService.getCurrentPrice(stock.symbol).subscribe((data) => {
  //     stock.price = data.c;
  //   });
  //   newStocks.push(stock);
  //   this.yourStocks.next(newStocks);
  //   console.log(newStocks);
  //   console.log(stock);
  // }

  getCurrentPrice() {
    this.yourStocks
      .pipe(
        mergeMap((data: YourStocks[]) => {
          const observables = data.map((stock) => {
            return this.dataService.getCurrentPrice(stock.symbol).pipe(
              map((data: any) => {
                stock.price = data.c;
                return stock; // Emituje svaki stock nakon što se cena ažurira
              })
            );
          });
          return forkJoin(observables); // čeka da se sve observabele završe i emituje sve vrednosti
        })
      )
      .subscribe(
        (updatedStocks: YourStocks[]) => {
          this.yourStocks.next(updatedStocks); // Emituje ažurirane akcije u svoje podsakcije
          console.log(updatedStocks); // Ispisuje ažurirane akcije u svoje podsakcije
        },
        (error) => {
          console.error('Error updating stock prices:', error);
        }
      );
  }

  getStockPrice(symbol: string) {}
  ngOnInit(): void {
    this.getCurrentPrice();
  }
}
