// Describe the thing that's being tested
describe('Homepage', () => {

    /* ============================================ */
    /* TEST: CHECK HOMEPAGE TITLE                   */
    /* ============================================ */

    it('should have a title', () => {

        const title = "My Website";
        expect(title).toEqual("My Website");

    });

});