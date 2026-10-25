export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
}

export const categories = [
  { name: 'Classic Coffee' },
  { name: 'Cold & Brewed' },
  { name: 'Tea' },
  { name: 'Pastry & Dessert' },
  { name: 'Best Sellers' },
];

export const products: Product[] = [
  { id: 1, name: 'Espresso', price: 40000, category: 'Classic Coffee', image: '/images/espresso.jpg' },
  { id: 2, name: 'Americano', price: 45000, category: 'Classic Coffee', image: '/images/espresso.jpg' },
  { id: 3, name: 'Cappuccino', price: 50000, category: 'Classic Coffee', image: '/images/espresso.jpg' },
  { id: 4, name: 'Latte', price: 50000, category: 'Classic Coffee', image: '/images/espresso.jpg' },
  { id: 5, name: 'Cold Brew Standard', price: 45000, category: 'Cold & Brewed', image: '/images/espresso.jpg' },
  { id: 6, name: 'Cold Brew Milk', price: 50000, category: 'Cold & Brewed', image: '/images/espresso.jpg' },
  { id: 7, name: 'Green Tea', price: 35000, category: 'Tea', image: '/images/espresso.jpg' },
  { id: 8, name: 'Croissant', price: 35000, category: 'Pastry & Dessert', image: '/images/espresso.jpg' },
];