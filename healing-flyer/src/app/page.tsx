import Image from "next/image";
import FlyerGenerator from "./FlyerGenerator";

export default function Home() {
  return (
   <div className="min-h-screen bg-slate-100">
      <FlyerGenerator />
    </div>
  );
}
