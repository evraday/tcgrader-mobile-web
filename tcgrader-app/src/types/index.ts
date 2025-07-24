export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export enum SubscriptionType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid'
}

export interface SubscriptionLimits {
  gradesPerMonth: number;
  collectionsAllowed: number;
  priceTrackingInterval: 'none' | 'daily' | 'realtime';
  bulkOperations: boolean;
  apiAccess: boolean;
}

export interface Card {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  number: string;
  rarity: CardRarity;
  condition: CardCondition;
  language: string;
  foil: boolean;
  signed: boolean;
  altered: boolean;
  frontImage?: string;
  backImage?: string;
  prices?: CardPrices;
  tcgPlayerId?: string;
  scryfallId?: string;
}

export enum CardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  MYTHIC = 'mythic',
  SPECIAL = 'special'
}

export enum CardCondition {
  MINT = 'mint',
  NEAR_MINT = 'near_mint',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  LIGHT_PLAYED = 'light_played',
  PLAYED = 'played',
  POOR = 'poor'
}

export interface CardPrices {
  market: number;
  low: number;
  mid: number;
  high: number;
  foilMultiplier?: number;
  lastUpdated: Date;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  cards: CollectionCard[];
  totalValue: number;
  totalCards: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionCard {
  id: string;
  cardId: string;
  collectionId: string;
  quantity: number;
  acquiredPrice?: number;
  acquiredDate?: Date;
  notes?: string;
  card: Card;
}

export interface Grade {
  id: string;
  userId: string;
  cardId: string;
  submissionId?: string;
  service: GradingService;
  grade?: number;
  subgrades?: Subgrades;
  status: GradeStatus;
  submittedAt: Date;
  receivedAt?: Date;
  certificateNumber?: string;
  populationReport?: PopulationReport;
  images: GradeImages;
}

export enum GradingService {
  PSA = 'psa',
  BGS = 'bgs',
  CGC = 'cgc',
  SGC = 'sgc'
}

export enum GradeStatus {
  PREPARING = 'preparing',
  SUBMITTED = 'submitted',
  RECEIVED = 'received',
  GRADING = 'grading',
  ENCAPSULATING = 'encapsulating',
  SHIPPING = 'shipping',
  COMPLETED = 'completed'
}

export interface Subgrades {
  centering: number;
  corners: number;
  edges: number;
  surface: number;
}

export interface PopulationReport {
  total: number;
  higherGrades: number;
}

export interface GradeImages {
  front: string;
  back: string;
  angles?: string[];
  defects?: DefectImage[];
}

export interface DefectImage {
  url: string;
  type: DefectType;
  description: string;
}

export enum DefectType {
  SCRATCH = 'scratch',
  WHITENING = 'whitening',
  CREASE = 'crease',
  BEND = 'bend',
  PRINT_LINE = 'print_line',
  OTHER = 'other'
}

export interface PriceAlert {
  id: string;
  userId: string;
  cardId: string;
  condition: CardCondition;
  targetPrice: number;
  alertType: 'above' | 'below';
  isActive: boolean;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  stripePaymentIntentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  REFUND = 'refund'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}