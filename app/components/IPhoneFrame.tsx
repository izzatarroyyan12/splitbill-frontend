import StatusBar from './StatusBar';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

export default function IPhoneFrame({ children }: IPhoneFrameProps) {
  const mainContent = (
    <div className="relative h-full">
      <StatusBar />
      <div className="content-with-status-bar">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Desktop: iPhone Frame */}
      <div className="hidden md:block">
        <div className="iphone-frame">
          <div className="iphone-screen">
            {mainContent}
          </div>
        </div>
      </div>

      {/* Mobile: Full Screen */}
      <div className="md:hidden w-full min-h-screen">
        {mainContent}
      </div>
    </div>
  );
} 