import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { stats } from "@/lib/data";

export function Stats() {
    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
                <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground pt-1">
                            {stat.progress}% to next level
                        </p>
                        <Progress value={stat.progress} className="mt-2 h-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
