-- Products table already has ALL policy for admins, but let's verify DELETE works
-- The existing "Admins can manage products" policy with ALL command already covers DELETE
-- No additional migration needed

SELECT 1;
