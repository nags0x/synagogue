function sum(a, b){
    return a + b;
}

test("check sum", () => {
    expect(sum(1,3)).toBe(4);
})