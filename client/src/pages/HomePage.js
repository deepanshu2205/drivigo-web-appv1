import React from 'react';
 import { Link } from 'react-router-dom';
 import heroImage from '../assets/hero-image4.png'; // <-- Import the image
 
 function HomePage() {
   return (
     <div className="py-16">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8">
         {/* Left Section: Text and Button */}
         <div className="md:w-1/2 text-center md:text-left">
           <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 text-gray-900">
             Drivigo se Seekho!
           </h1>
           <p className="text-lg text-gray-600 mb-8">
             Gaadi seekhni h? Hum sikha denge! Verified instructors se seekho aur securely pay kro ❤️
           </p>
           <div>
             <Link to="/book-lesson" className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-lg text-lg">
               Book Now!
             </Link>
           </div>
         </div>
 
         {/* Right Section: Hero Image */}
         <div className="md:w-1000">
           <img
             src={heroImage}
             alt="A person have already learnt driving from driving and very confident and happy"
             className="w-full h-auto "
             style={{ maxHeight: '500px' }}
           />
         </div>
       </div>
     </div>
   );
 }
 
 export default HomePage;