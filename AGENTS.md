# rules for Markdown-schema

In this project we work ttd, so we write tests before we implement the functionality. Code coverage is important in this project we aim for 100% code coverage, You are expected to write tests for all new functionality you add, and to update existing tests if you change existing functionality.

The extensions should not leak outside of their folders, this means that they should have separate tests, implementation, schema definitions, and documentation.
The only time they should be mentioned is with integration with the main package, so it should be in a list of extensions that then gets pulled in if the schema uses it.

This is a user facing project, so the documentation is very important, there are atleast 4 difrent places where documentation lives, the readme, the jsdoc comments in the code and the documentation in the extensions folders and the documentation in the documentation folder.
For every change you make, you should update the documentation in all of these places, and make sure that they are consistent with each other. where the readme should be a high level overview of the project and thus should be brought but not go into to much detail, the documentation in the extensions folders and the documentation folder should go into detail and should contain many examples of how to use the functionality, and the jsdoc comments should be a technical description of the functionality and should contain examples of how to use it in code.
