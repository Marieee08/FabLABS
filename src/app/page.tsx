import { Calendar } from '@/components/ui/calendar';
import { Carousel } from '@/components/ui/carousel';
import { Slider } from '@/components/ui/slider';
import { Menubar } from '@/components/ui/menubar';
import Navbar from '@/components/custom/navbar';
import Link from "next/link";
import Image from 'next/image';


export default function Home() {
  return (
    <main className="w-full min-h-screen bg-[#f4f8fc]">
    <Navbar />


    <section id="home" className="grid grid-cols-1 md:grid-cols-2 items-center h-auto pt-0 pb-5 px-4 md:px-6">
      <div className="flex items-center justify-center order-2 md:order-1 mb-6 md:mb-0 mt-8 md:mt-20">
        <img
          src="images/elements/landingelement.gif"
          alt="Fabrication Laboratory of PSHS-EVC"
          className="w-full max-w-[90%] md:max-w-[110%] mt-2 md:mt-4 ml-12"
        />
      </div>


      <div className="relative z-1 flex flex-col justify-center text-right order-1 md:order-2 px-4 md:px-20 py-6 md:p-10 md:pl-28">
        <p className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium text-sm ml-auto mb-2 border border-[#5e86ca]">
          Turn your Imagination into Reality
        </p>
        <h1 className="text-5xl md:text-7xl font-qanelas2">Innovate to</h1>
        <h2 className="block text-5xl md:text-7xl font-qanelas3 text-[#f5a237] mb-5">ELEVATE</h2>
        <p className="text-md font-poppins1 mb-5">
          The PSHS-EVC fab lab is a small-scale workshop offering digital fabrication. A fab lab is typically equipped with an array of flexible
          computer-controlled tools that cover several different length scales and various materials with the aim to <span className="font-poppins2">make "almost anything".</span>
        </p>
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
          <a href="/user-services" className="border border-[#5e86ca] bg-[#193d83] text-white font-qanelas1 text-lg py-1 px-6 rounded-md hover:bg-[#2f61c2] transition duration-300 ml-auto">
            Get Started
          </a>
          <a href="https://www.facebook.com/fablabeasternvisayas" className="text-[#1c62b5] font-qanelas1 text-lg py-1 px-6 rounded-md transition-all duration-300 flex items-center justify-end transform hover:scale-105">
            Learn More
            <span className="ml-2 text-[#1c62b5] transition-all duration-300 hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </section>


    <section id="events" className="relative p-10 pl-20 pr-20 py-20">
      <div className="absolute left-20 right-20 h-[60%] top-5 bg-[#0b1d41] rounded-3xl" />
      <div className="px-20 relative">
        <h2 className="text-4xl font-qanelas2 mb-5 text-center text-white">
          Let us help you <span className="text-[#f5a237]">create!</span>
        </h2>
        <p className="text-lg mb-8 font-poppins1 text-center text-white">
          Stay tuned for our upcoming events. We regularly host workshops, fairs, and other exciting activities.
          Check back often for the latest updates and event details!
        </p>
       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="bg-white rounded-2xl border border-[#5e86ca] hover:shadow-lg hover:shadow-blue-300/50 hover:text-blue-800 transform hover:scale-105 transition-all duration-300">
            <div className="p-10">
              <img src="images/elements/who.png" alt="who" className="size-14"/>
              <h3 className="text-xl font-semibold mb-2 font-qanelas2 font-md pt-5">Who can avail?</h3>
              <p className="text-gray-700 mb-4 font-poppins1">
                Fab labs are available as a community resource, offering open access for individuals as well as scheduled access for programs.
              </p>
            </div>
          </div>


          <div className="bg-white rounded-2xl border border-[#5e86ca] hover:shadow-lg hover:shadow-blue-300/50 hover:text-blue-800 transform hover:scale-105 transition-all duration-300">
            <div className="p-10">
              <img src="images/elements/why.png" alt="why" className="size-14"/>
              <h3 className="text-xl mb-2 font-qanelas2 pt-5">Why was the FabLab established?</h3>
              <p className="text-gray-700 mb-4 font-poppins1">
                Fab lab Eastern Visayas is set up to inspire people and MSMEs of the region to turn their ideas into new products and prototypes by giving them access to a range of digital manufacturing technology.
              </p>
            </div>
          </div>


          <div className="bg-white rounded-2xl border border-[#5e86ca] hover:shadow-lg hover:shadow-blue-300/50 hover:text-blue-800 transform hover:scale-105 transition-all duration-300">
            <div className="p-10">
              <img src="images/elements/where.png" alt="where" className="size-14"/>
              <h3 className="text-xl font-semibold mb-2 font-qanelas2 font-md pt-5">Where is the FabLab located?</h3>
              <p className="text-gray-700 mb-4 font-poppins1">
                Fab lab Eastern Visayas is located at PSHS-EVC, Ground Floor, Lab Tech Building, Pawing, Palo, Leyte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>


    <div className="w-full overflow-hidden mt-2 pb-4">
      <div className="inline-flex flex-nowrap">
        <ul x-ref="slides" className="flex items-center animate-infinite-scroll">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <li key={num} className="relative bg-white p-3 shadow-lg transform transition-transform hover:scale-105 mx-2 rounded-lg">  {/* Added mx-2 for horizontal margin */}
              <div className="w-64 h-64 relative">
                <img
                  src={`/images/slider/${num}.jpg`}
                  alt={`Slide ${num}`}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="h-10 bg-white flex items-center justify-center">
                <div className="w-16 h-1 bg-gray-200 rounded"></div>
              </div>
            </li>
          ))}
        </ul>


        <ul x-ref="logos" className="flex items-center animate-infinite-scroll">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <li key={num} className="relative bg-white p-3 shadow-lg transform transition-transform hover:scale-105 mx-2 rounded-lg"> {/* Added mx-2 for horizontal margin */}
              <div className="w-64 h-64 relative">
                <img
                  src={`/images/slider/${num}.jpg`}
                  alt={`Slide ${num}`}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="h-10 bg-white flex items-center justify-center">
                <div className="w-16 h-1 bg-gray-200 rounded"></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>


    <section id="machines" className="p-10 pt-20 pl-20 pr-20 pb-auto">
        <p className="inline-block text-[#193d83] font-poppins1 text-md ml-auto mb-2">
          Here's what we can offer!</p>
          <h2 className="text-3xl font-bold mb-2 text-left font-qanelas2">Machines and Services</h2>
        <p className="text-lg mb-8 text-left font-poppins1 text-[#605e63]">Our FabLab is equipped with state-of-the-art tools and resources to support a wide range of projects and initiatives.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-auto ">
         
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-[#5e86ca] hover:shadow-lg hover:shadow-blue-300/50 transform hover:scale-105 transition-all duration-300">
            <div className="p-8">
              <div className="flex space-x-2 mb-2 font-figtree3">
                <p className="text-ms py-1 px-3 rounded bg-blue-100 border border-[#5e86ca] rounded-full text-blue-800">Etch Patterns</p>
                <p className="text-ms py-1 px-3 rounded bg-[#fef0db] rounded-full border border-[#f5a237] rounded-full text-[#ee8b1a]">Cut Materials</p>
              </div>
              <h3 className="text-2xl font-qanelas3">Laser Cutter</h3>
            <a href="/user-services" className="text-[#145da0] hover:underline mb-2">Learn More</a>
            </div>


            <div className="relative h-[318px]">
                  <img src="images/machines/trylaser.png" alt="machine" className="absolute bottom-0" />
            </div>
          </div>


          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-[#5e86ca] hover:shadow-lg hover:shadow-blue-300/50 transform hover:scale-105 transition-all duration-300">
            <div className="p-8">
              <div className="flex space-x-2 mb-2 font-figtree3">
                <p className="text-ms py-1 px-3 rounded bg-blue-100 border border-[#5e86ca] rounded-full text-blue-800">Prototyping</p>
                <p className="text-ms py-1 px-3 rounded bg-[#fef0db] rounded-full border border-[#f5a237] rounded-full text-[#ee8b1a]">Create 3D Models</p>
              </div>
              <h3 className="text-2xl font-qanelas3">3D Printer</h3>
            <a href="/user-services" className="text-[#145da0] hover:underline mb-2">Learn More</a>
            </div>


            <div className="relative h-[318px]">
                  <img src="images/machines/try3dprint.png" alt="machine" className="absolute bottom-0" />
            </div>
          </div>


          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-[#5e86ca] hover:shadow-lg hover:shadow-blue-300/50 transform hover:scale-105 transition-all duration-300">
            <div className="p-8">
              <div className="flex space-x-2 mb-2 font-figtree3">
                <p className="text-ms py-1 px-3 rounded bg-blue-100 border border-[#5e86ca] rounded-full text-blue-800">Multi-purpose</p>
                <p className="text-ms py-1 px-3 rounded bg-[#fef0db] rounded-full border border-[#f5a237] rounded-full text-[#ee8b1a]">Carve Structures</p>
              </div>
              <h3 className="text-2xl font-qanelas3">CNC Mill</h3>
            <a href="/user-services" className="text-[#145da0] hover:underline mb-2">Learn More</a>
            </div>


            <div className="relative h-[318px]">
                  <img src="images/machines/trycncmill.png" alt="machine" className="absolute bottom-0" />
            </div>
          </div>


          <div className=" p-6 rounded-lg text-center align-middle pt-28">
            <p className="inline-block text-[#193d83] font-poppins1 text-md ml-auto mb-2">Don't worry, there's more!</p>
            <h3 className="text-3xl font-qanelas3 mb-1 text-[#0e4579]">Machines and Services</h3>
            <p className="text-lg mb-4 font-figtree4">Visit our Machines and Services Page</p>
            <p className="text-md mb-10 font-poppins1 px-10">Our FabLab is equipped with state-of-the-art tools and resources to support a wide range of projects and initiatives. Whether you are an entrepreneur, student, or hobbyist, we provide the support and expertise to bring your ideas to life.</p>
            <a href="/user-services" className="border border-[#5e86ca] bg-[#193d83] text-white font-qanelas1 text-lg py-1 px-6 rounded-md hover:bg-[#2f61c2] transition duration-300 ml-auto">Services</a>
          </div>
        </div>
    </section>


    <section id="about" className="bg-[#f4f8fc] py-20">
        <div className="container mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div>
                <p className="text-[#f5a237] font-poppins1 text-lg mb-2">Who We Are</p>
                <h2 className="text-4xl md:text-3xl font-qanelas3 mb-6">About Our Lab</h2>
                <div className="w-20 h-1 bg-[#0e4579] rounded-full mb-8"></div>
              </div>
             
              <p className="text-lg font-poppins1 text-gray-700">
                Our FabLab is more than just a workspace—it's a hub of innovation where ideas
                transform into reality. We provide state-of-the-art digital fabrication tools
                and expertise to support a diverse community of makers, from students to
                entrepreneurs.
              </p>
             
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="font-qanelas2 text-xl mb-3">Our Mission</h3>
                  <p className="font-poppins1 text-gray-600">
                    To democratize access to digital fabrication tools and empower innovation
                    in our community.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="font-qanelas2 text-xl mb-3">Our Vision</h3>
                  <p className="font-poppins1 text-gray-600">
                    To be the premier hub for digital fabrication and technological innovation
                    in Eastern Visayas.
                  </p>
                </div>
              </div>


              <a href="/user-services" className="inline-block border border-[#5e86ca] bg-[#193d83] text-white font-qanelas1 text-lg py-1 px-6 rounded-md hover:bg-[#2f61c2] transition duration-300 ml-auto">
                Learn More About Us
              </a>
            </div>


            {/* Right Column - Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-xl text-center shadow-lg">
                <span className="text-4xl font-qanelas3 text-[#0e4579] block mb-2">100+</span>
                <p className="font-poppins1 text-gray-600">Projects Completed</p>
              </div>
              <div className="bg-white p-8 rounded-xl text-center shadow-lg">
                <span className="text-4xl font-qanelas3 text-[#0e4579] block mb-2">100+</span>
                <p className="font-poppins1 text-gray-600">Students Trained</p>
              </div>
              <div className="bg-white p-8 rounded-xl text-center shadow-lg">
                <span className="text-4xl font-qanelas3 text-[#0e4579] block mb-2">DTI</span>
                <p className="font-poppins1 text-gray-600">Partnered with DTI</p>
              </div>
              <div className="bg-white p-8 rounded-xl text-center shadow-lg">
                <span className="text-4xl font-qanelas3 text-[#0e4579] block mb-2">10+</span>
                <p className="font-poppins1 text-gray-600">Workshops Held</p>
              </div>
            </div>
          </div>
        </div>
    </section>
   
    </main>
  );
}

