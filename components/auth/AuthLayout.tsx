import Link from "next/link";

const AuthLayout = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      
      {/* LEFT BRAND */}
      <div className="hidden md:flex flex-col justify-center bg-black text-white px-16">
        <h1 className="text-4xl font-serif mb-4">AGPH Books Store</h1>
        <p className="text-gray-300 max-w-md">
          India’s trusted self-publishing & eBook platform.  
          Read, publish & grow with AGPH.
        </p>
      </div>

      {/* RIGHT FORM */}
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-1">{title}</h2>
          <p className="text-sm text-gray-600 mb-6">{subtitle}</p>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
