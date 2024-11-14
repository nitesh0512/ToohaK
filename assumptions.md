# Assumptions

// Write headings in this format
// Can write other text normally, any other fancy fonts/layouts can be googled on markdown
// https://www.markdownguide.org/basic-syntax/

## adminAuthRegister

- Assume that parameters are in string format
- Assume that function receives the correct number of parameter (mark this)
- Assume that the validator packages used in the function works correctly (mark this)

## adminAuthLogin

- Assume that there is at least one user registered (mark this)
- Similar assumptions to adminAuthRegister

## adminUserDetails

- Assume that numSuccessfulLogins is calculated in adminAuthLogin (mark this)
- Assume that numFailedPasswordsSinceLastLogin is calculated in adminAuthLogin (mark this)

## adminQuizList

- Similar assumptions to adminAuthLogin

## adminQuizCreate

- Similar assumptions to adminAuthLogin
- This function pushes up new quiz information to user.ownedQuizzes as well

## adminQuizRemove

- Assume that there is at least one user registered
- Assume that user owns at least one quiz (mark this)

## adminQuizInfo

- Assume that there is at least one user registered
- Assume that there is at least one quiz registered

## adminQuizNameUpdate

- Similar assumptions to adminQuizRemove

## adminQuizDescriptionUpdate

- Similar assumptions to adminQuizRemove
