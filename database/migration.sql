-- Database Migration Script for MarketMe
-- Run this in Supabase SQL Editor to create offers and recently_viewed tables

-- 1. Create user_recently_viewed table
CREATE TABLE IF NOT EXISTS user_recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_recently_viewed_user_id ON user_recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recently_viewed_listing_id ON user_recently_viewed(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_recently_viewed_viewed_at ON user_recently_viewed(viewed_at DESC);

-- 2. Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offered_price NUMERIC NOT NULL CHECK (offered_price > 0),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_price CHECK (offered_price > 0)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller_id ON offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC);

-- 3. Update listings table to add views_count if it doesn't exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE user_recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_recently_viewed
-- Users can only see their own recently viewed
CREATE POLICY "Users can view their own recently viewed"
  ON user_recently_viewed FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recently viewed
CREATE POLICY "Users can insert their own recently viewed"
  ON user_recently_viewed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recently viewed
CREATE POLICY "Users can update their own recently viewed"
  ON user_recently_viewed FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own recently viewed
CREATE POLICY "Users can delete their own recently viewed"
  ON user_recently_viewed FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS Policies for offers
-- Users can view offers for their listings (as seller) or offers they made (as buyer)
CREATE POLICY "Users can view their offers"
  ON offers FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Users can create offers
CREATE POLICY "Users can create offers"
  ON offers FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update offers for their listings
CREATE POLICY "Sellers can update offers for their listings"
  ON offers FOR UPDATE
  USING (auth.uid() = seller_id);

-- Buyers can update their own offers (for countering)
CREATE POLICY "Buyers can update their own offers"
  ON offers FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Sellers can delete offers from their listings
CREATE POLICY "Sellers can delete offers"
  ON offers FOR DELETE
  USING (auth.uid() = seller_id);

-- 7. Create function to auto-increment views_count
CREATE OR REPLACE FUNCTION increment_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings SET views_count = views_count + 1 WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tracking views
DROP TRIGGER IF EXISTS on_listing_viewed ON user_recently_viewed;
CREATE TRIGGER on_listing_viewed
AFTER INSERT ON user_recently_viewed
FOR EACH ROW
EXECUTE FUNCTION increment_views_count();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_recently_viewed TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON offers TO authenticated;
GRANT SELECT ON listings TO authenticated;
GRANT UPDATE (views_count) ON listings TO authenticated;
