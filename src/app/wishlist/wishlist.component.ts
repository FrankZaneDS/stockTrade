import { Component, inject, OnInit } from '@angular/core';
import { StockComponent } from '../stock/stock.component';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [StockComponent, CommonModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
})
export class WishlistComponent implements OnInit {
  dataService = inject(DataService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  wishlist$ = this.dataService.wishlist$;
  balance$ = this.dataService.balance$;
  ngOnInit(): void {
    console.log(this.wishlist$.getValue());
  }
}
