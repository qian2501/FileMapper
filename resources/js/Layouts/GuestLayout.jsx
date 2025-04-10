import Card from '@/Components/Card';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center pt-6 sm:pt-0 bg-gray-800">
            <Card className="sm:max-w-md">{children}</Card>
        </div>
    );
}
