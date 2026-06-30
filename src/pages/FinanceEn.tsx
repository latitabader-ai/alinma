import { MobileContainer } from "@/components/MobileContainer";
import { Plus, FileText, Clock, UserSquare, Home as HomeIcon, Car, BookOpen } from "lucide-react";

export default function FinanceEn() {
  return (
    <MobileContainer className="p-4 relative">
      <div className="absolute top-20 right-6 text-right z-0">
        <p className="text-accent text-sm font-medium">Financing solutions</p>
        <h2 className="text-white text-3xl font-bold">Fits your<br/>needs</h2>
      </div>

      <header className="mt-4 mb-32 z-10 relative">
        <h1 className="text-white font-medium text-xl">Finance</h1>
      </header>

      <div className="bg-card text-card-foreground rounded-[24px] p-5 shadow-xl flex-1 relative z-10">
        <div className="flex justify-between gap-4 -mt-12 mb-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-center">New<br/>Finance</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-white border border-gray-100 shadow-md rounded-2xl flex items-center justify-center text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-center">Request<br/>Tracker</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-white border border-gray-100 shadow-md rounded-2xl flex items-center justify-center text-primary">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-center">Finance<br/>History</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0">
              <UserSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-primary mb-1">Personal Finance</h3>
              <p className="text-xs text-muted-foreground">Multiple personal financing solutions</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-primary mb-1">Auto Lease</h3>
              <p className="text-xs text-muted-foreground">Flexible car financing options</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0">
              <HomeIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-primary mb-1">Mortgage</h3>
              <p className="text-xs text-muted-foreground">Financing you to own your home</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-primary mb-1">Education Finance</h3>
              <p className="text-xs text-muted-foreground">Invest in your future with easy financing</p>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}
