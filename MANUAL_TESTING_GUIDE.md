# Manual Testing Guide: Re-registration After Rejection

This guide outlines the manual testing scenarios for the re-registration after rejection feature.

## Test Environment Setup

1. Ensure you have at least 3 test users:
   - Admin user (with `admin` role)
   - User A (regular member)
   - User B (regular member)
2. Create a test event with:
   - Registration window open
   - Quota set to a reasonable number (e.g., 10)
   - At least 2 forms (Form A and Form B)
3. Configure forms with at least one required field

## Test Scenarios

### Scenario 1: Single User Re-registration After Admin Rejection

**Steps:**
1. Log in as User A
2. Navigate to the event and fill out Form A
3. Submit the form successfully
4. Verify submission appears in User A's portal with "Pending" status
5. Log in as Admin
6. Navigate to Form A submissions
7. Review User A's submission and **reject** it
8. Log back in as User A
9. Navigate to Form A again
10. **Expected:** Form should be accessible (not blocked by "already submitted" message)
11. Fill out and submit Form A again
12. **Expected:** New submission is created successfully

**Verification:**
- Check database: Both submissions exist (old with `review_status = rejected`, new with `review_status = pending`)
- Check admin submissions list: Both submissions should be visible
- Check CSV export: Both submissions should be included

---

### Scenario 2: User Can Submit Different Form After Rejection

**Steps:**
1. Log in as User A
2. Submit Form A
3. Try to access Form B
4. **Expected:** "You have already chosen another registration form" message
5. Log in as Admin
6. Reject User A's Form A submission
7. Log back in as User A
8. Try to access Form B again
9. **Expected:** Form B should now be accessible
10. Submit Form B successfully

**Verification:**
- User A has Form A submission (rejected) and Form B submission (pending)
- Both visible in admin dashboard

---

### Scenario 3: Team Member Can Re-register After Declining Invitation

**Prerequisites:** Form A configured as "team" mode with team_size = 2

**Steps:**
1. Log in as User A (leader)
2. Submit Form A with User B's email as team member
3. Verify User B receives invitation email
4. Log in as User B
5. Navigate to team invitation page
6. **Decline** the invitation with a reason
7. **Expected:** Invitation record is deleted
8. Try to access Form A
9. **Expected:** Form should be accessible for individual registration
10. Submit Form A as individual registrant

**Verification:**
- User B's declined invitation is deleted from database
- User B now has a new individual submission for Form A
- User A's team leader submission remains unchanged

---

### Scenario 4: Team Leader Can Re-invite After Admin Rejection

**Prerequisites:** Form A configured as "team" mode with team_size = 2

**Steps:**
1. Log in as User A (leader)
2. Submit Form A with User B's email as team member
3. Log in as User B
4. Accept the team invitation
5. Log in as Admin
6. **Reject** User B's team member submission
7. Log back in as User A
8. Try to submit Form A again with User B as team member
9. **Expected:** Team submission should succeed (User B can be re-invited)

**Verification:**
- Two submissions exist for User B: old (rejected) and new (pending)
- User B receives new invitation email

---

### Scenario 5: Bundle Registration Re-submission

**Prerequisites:** Form A configured as "bundle" mode with max_team_size = 3

**Steps:**
1. Log in as User A (leader)
2. Submit Form A with User B as bundle member (include User B's form data)
3. Log in as Admin
4. Reject the entire bundle submission (leader and all members)
5. Log back in as User A
6. Try to submit Form A again with same or different members
7. **Expected:** Bundle submission should succeed

**Verification:**
- All old submissions have `review_status = rejected`
- All new submissions have `review_status = pending`
- Same `group_token` for new bundle members

---

### Scenario 6: Quota Behavior with Rejected Submissions

**Prerequisites:** Event with quota = 2

**Steps:**
1. Log in as User A
2. Submit Form A (quota: 1/2 used)
3. Log in as Admin
4. Reject User A's submission
5. **Note:** `registered_count` remains 1 (not decremented)
6. Log back in as User A
7. Submit Form A again (quota: 2/2 used)
8. Log in as User B (different user)
9. Try to submit Form A
10. **Expected:** "Quota full" message

**Known Limitation:**
Rejected submissions still count toward `registered_count`. This is documented behavior that may need separate addressing if quota accuracy is critical.

---

## CSV Export Verification

1. Log in as Admin
2. Navigate to event registrants page
3. Download CSV export
4. **Verify:** All submissions (including rejected ones) are included with proper `review_status` values

---

## Edge Cases to Test

### Multiple Rejections
1. User submits → Admin rejects
2. User resubmits → Admin rejects again
3. User resubmits third time
4. **Expected:** All three submissions exist in database with appropriate status

### Mixed Status in Team
1. Team of 3 submitted
2. Admin accepts leader
3. Admin rejects member 1
4. Member 2 still pending
5. **Expected:** Each member's status is independent

### Expired Invitations
1. Team invitation sent to User B
2. Wait for invitation to expire (or manually set `invitation_expired_at` to past)
3. User B tries to access form
4. **Expected:** User B should be able to register (expired invitations should not block)

---

## Post-Testing Checklist

- [ ] All rejected submissions remain in database for audit
- [ ] Users can successfully re-register after rejection
- [ ] Users can switch to different forms after rejection
- [ ] Team/bundle workflows work correctly
- [ ] CSV exports include all submissions
- [ ] No database constraint violations
- [ ] Email notifications sent appropriately
- [ ] Quota counting behaves as documented (may need improvement)

---

## Rollback Plan

If issues are discovered:

1. Revert changes to:
   - `app/Models/FormAnswer.php` (remove `scopeExcludeRejectedSubmissions`)
   - `app/Services/Form/FormAccessGuard.php` (remove scope calls)
   - `app/Services/Registration/TeamRegistrationSubmitter.php` (remove scope call)
   - `app/Services/Registration/BundleRegistrationSubmitter.php` (remove scope call)

2. Run migrations if any were added (none in this implementation)

3. Clear application cache:
   ```bash
   php artisan cache:clear
   php artisan config:clear
   ```
