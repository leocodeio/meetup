import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthIndex() {
  return (
    <div className="flex flex-col space-y-4">
      <Button className="w-full">
        <Link href="auth/login">Login</Link>
      </Button>
      <Button className="w-full">
        <Link href="auth/signup">Signup</Link>
      </Button>
      <Button variant="outline" className="w-full">
        <Link href="">Back to Home</Link>
      </Button>
    </div>
  );
}
