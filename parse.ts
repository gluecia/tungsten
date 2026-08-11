interface Expr {
    render(): string;
}

class SurroundExpr implements Expr {
    readonly surroundChar: string;
    readonly inner: Expr;

    constructor(inner: Expr, surroundChar: string) {
        this.inner = inner;
        this.surroundChar = surroundChar;
    }

    render(): string {
        return `${this.surroundChar}${this.inner.render()}${this.surroundChar}`;
    }
}

class StringExpr implements Expr {
    readonly inner: string;

    constructor(inner: string) {
        this.inner = inner;
    }

    render(): string {
        return this.inner;
    }
}

class CodeExpr implements Expr {
    readonly language: string;
    readonly inner: string;

    constructor(inner: string, language: string) {
        this.inner = inner;
        this.language = language;
    }

    render(): string {
        return `\`\`\`${this.language}\n${this.inner}\n\`\`\``
    }
}

class HeadingExpr implements Expr {
    readonly level: number;
    readonly inner: Expr;

    constructor(inner: Expr, level: number) {
        this.inner = inner;
        this.level = level;
    }

    render(): string {
        let output = "";
        for (let i = 0; i < this.level; i++) {
            output += "#";
        }

        return output + " " + this.inner.render()
    }
}

class RootExpr implements Expr {
    readonly inner: Expr[];

    constructor(inner: Expr[]) {
        this.inner = inner;
    }

    render(): string {
        return this.inner.reduce((acc, expr) => acc += expr.render(), "");
    }
}

export class Scanner {
    readonly source: string;
    private current: number = 0;
    private start: number = 0;
    private exprList: Expr[] = [];

    constructor(source: string) {
        this.source = source;
    }

    scan(): RootExpr {
        while (!this.isAtEnd()) {
            this.exprList.push(this.scanToken());
        }

        return new RootExpr(this.exprList);
    }

    scanToken(): Expr {
        const c = this.advance();

        switch (c) {
            case '*':
                return this.heading();
            default:
                return this.string();
        }
    }

    private heading(): HeadingExpr {
        let headingLevel = 1;
        while (this.peek() === "*" && !this.isAtEnd()) {
            this.advance();
            headingLevel++;
        }

        this.start = this.current;

        while (this.peek() !== "\n" && !this.isAtEnd()) {
            this.advance();
        }

        this.advance()

        const scanner = new Scanner(this.source.substring(this.start, this.current + 1));
        const inner = scanner.scan();
        return new HeadingExpr(inner, headingLevel);
    }

    private string(): StringExpr {
        const specialCharacters = /\*/;

        this.start = this.current;
        if (!specialCharacters.test(this.peek()) && !this.isAtEnd()) {
            const c = this.advance();
            if (c === '\\' && !this.isAtEnd()) {
                this.advance();
            }
        }

        return new StringExpr(this.source.substring(this.start, this.current + 1));
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        return this.source.charAt(this.current++);
    }

    private peek(): string {
        if (this.isAtEnd()) return "\0";

        return this.source.charAt(this.current);
    }
}

const scan = new Scanner("** hello!");
console.log(scan.scan().render())
