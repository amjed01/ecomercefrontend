/*components:flashdeals.tsx */
import React from 'react';

const flashDeals = [
  {
    id: 1,
    image: 'path_to_image/outdoor_rug.png',
    price: 25.99,
    oldPrice: 47.99,
    title: 'SIXHOME Outdoor Rug 5\'x8\' Waterproof Patio Rug',
    options: 'Options from $25.99 - $99.99',
  },
  {
    id: 2,
    image: 'path_to_image/umbrella.png',
    price: 34.99,
    oldPrice: 219.99,
    title: 'Yangming 9FT Outdoor Patio Umbrella with Push Button Tilt',
  },
  {
    id: 3,
    image: 'path_to_image/ps5_controller.png',
    price: 73.99,
    oldPrice: null,
    title: 'Sony PS5 DualSense Wireless Controller - Starlight Blue',
  },
  {
    id: 4,
    image: 'path_to_image/blanket.png',
    price: 12.99,
    oldPrice: 31.98,
    title: 'Exclusivo Mezcla Plush Fuzzy Large Fleece Throw Blanket',
    options: 'Options from $12.99 - $13.99',
  },
  {
    id: 5,
    image: 'path_to_image/air_purifier.png',
    price: 96.99,
    oldPrice: 199.99,
    title: 'GCZ Air Purifier for Large Rooms, 2500 Sq. ft Smart Wi...',
  },
  {
    id: 6,
    image: 'path_to_image/indoor_rug.png',
    price: 16.99,
    oldPrice: null,
    title: 'BERTHMEER 3\'x5\' Washable Area Rugs indoor Small Rugs',
    options: 'Options from $16.99 - $269.99',
  },
  
];

const FlashDeals = () => {
  return (
    <div id="flashdeals" className="p-8">
      {/* Title and View All */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Flash Deals</h2>
        <a href="/all-deals" className="text-sm text-blue-500 hover:underline">
          View all
        </a>
      </div>
      
      {/* Flash Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {flashDeals.map((deal) => (
          <div key={deal.id} className="border rounded-lg p-4 shadow-lg relative">
            {/* Heart Icon */}
            <button className="absolute top-3 right-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400 hover:text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.637l1.318-1.319a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                />
              </svg>
            </button>
            {/* Product Image */}
            <img src={deal.image} alt={deal.title} className="w-full h-40 object-cover mb-4" />
            {/* Price and Discount */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-bold text-green-600">${deal.price.toFixed(2)}</span>
              {deal.oldPrice && <span className="line-through text-gray-500">${deal.oldPrice.toFixed(2)}</span>}
            </div>
            {/* Product Title */}
            <h3 className="text-sm font-semibold mb-2">{deal.title}</h3>
            {/* Options (if any) */}
            {deal.options && <p className="text-gray-600 text-xs mb-2">{deal.options}</p>}
            {/* Add Button */}
            <button className="bg-gray-200 hover:bg-gray-300 text-black text-xs py-1 px-4 rounded-md">
              + Add
            </button>
          </div>
        ))}
      </div>
      
    </div>
    
  );
};

export default FlashDeals;
