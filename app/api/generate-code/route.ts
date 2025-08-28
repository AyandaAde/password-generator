import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const includeNumbers = searchParams.get("includeNumbers");
    const includeSymbols = searchParams.get("includeSymbols");
    const minLength = searchParams.get("minLength") || "1";


    if (!text) return new NextResponse("Text required", { status: 400 });

    try {
        // Create a hash-like transformation of the input
        let password = text
        // Add numbers if requested
        if (includeNumbers) {
            const numbers = "0123456789"
            const numCount = Math.max(2, Math.floor(password.length * 0.2))
            for (let i = 0; i < numCount; i++) {
                const randomIndex = Math.floor(Math.random() * password.length)
                const randomNum = numbers[Math.floor(Math.random() * numbers.length)]
                password = password.slice(0, randomIndex) + randomNum + password.slice(randomIndex + 1)
            }
        }

        // Add symbols if requested
        if (includeSymbols) {
            const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
            const symbolCount = Math.max(2, Math.floor(password.length * 0.15))
            for (let i = 0; i < symbolCount; i++) {
                const randomIndex = Math.floor(Math.random() * password.length)
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)]
                password = password.slice(0, randomIndex) + randomSymbol + password.slice(randomIndex + 1)
            }
        };

        // Simple hash from combined string
        let hash = 0;
        for (let i = 0; i < parseInt(minLength) - 3; i++) {
            hash = (hash << 5) - hash + password.charCodeAt(i);
            hash |= 0; // Convert to 32-bit integer
        };

        let i = 0;

        // Ensure minimum length
        while (password.length < parseInt(minLength) - 3) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
            password += chars.charAt(Math.abs(hash + i * 31) % chars.length);
            i++;
        }

        // Combine password with current timestamp
        password = text + Date.now();

        // Shorten timestamp so total length <= 10
        const timestampPart = Date.now().toString(36).slice(-3); // last 3 chars of base36 timestamp

        return NextResponse.json({ password: `${password}${timestampPart}` }, { status: 200 });

    } catch (error: any) {
        console.error("Error creating password", error.message);
        return new NextResponse(error.message, { status: 500 });
    }

}