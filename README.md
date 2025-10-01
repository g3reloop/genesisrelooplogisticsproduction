# QMUL BA Politics International Relations Timetable

A responsive web application for displaying academic timetables for Queen Mary University of London's BA Politics International Relations program. Built with HTML5, CSS3, JavaScript, and Supabase for data management.

## Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **QMUL Branding**: Professional styling with official QMUL colors and typography
- **Real-time Data**: Connected to Supabase for live timetable updates
- **Interactive Events**: Click on events to view detailed information
- **Auto-refresh**: Automatically updates every 30 minutes
- **Accessibility**: WCAG 2.1 AA compliant design
- **Print-friendly**: Optimized for printing timetables

## Project Structure

```
├── index.html              # Main HTML file
├── styles.css              # CSS styling with QMUL theme
├── app.js                  # JavaScript application logic
├── supabase_schema.sql     # Database schema for Supabase
└── README.md              # This file
```

## Setup Instructions

### 1. Supabase Database Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/Login and create a new project
   - Note down your project URL and anon key

2. **Run the Database Schema**
   - In your Supabase dashboard, go to the SQL Editor
   - Copy and paste the contents of `supabase_schema.sql`
   - Execute the SQL to create tables, indexes, and sample data

3. **Verify Data**
   - Check that the `timetable_events` and `student_profile` tables are created
   - Verify that sample data has been inserted
   - Confirm that Row Level Security (RLS) policies are active

### 2. Frontend Configuration

1. **Update Supabase Configuration**
   - Open `app.js`
   - Replace `YOUR_SUPABASE_URL` with your actual Supabase project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your actual anon key

   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

2. **Test the Application**
   - Open `index.html` in a web browser
   - Verify that the timetable loads correctly
   - Test the interactive features (clicking events, modal display)

### 3. Deployment Options

#### Option A: Netlify (Recommended)

1. **Prepare for Deployment**
   - Create a new folder for your project
   - Copy all files (`index.html`, `styles.css`, `app.js`) to the folder
   - Update the Supabase configuration in `app.js`

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login and click "New site from files"
   - Drag and drop your project folder or connect to a Git repository
   - Your site will be live at a random URL (e.g., `https://amazing-name-123456.netlify.app`)

3. **Custom Domain (Optional)**
   - In Netlify dashboard, go to Domain settings
   - Add your custom domain
   - Configure DNS settings as instructed

#### Option B: Vercel

1. **Prepare for Deployment**
   - Create a new folder for your project
   - Copy all files to the folder
   - Update Supabase configuration

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login and click "New Project"
   - Upload your project folder or connect to Git
   - Your site will be live at a Vercel URL

#### Option C: GitHub Pages

1. **Create GitHub Repository**
   - Create a new repository on GitHub
   - Upload all files to the repository
   - Update Supabase configuration

2. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select source branch (usually `main`)
   - Your site will be live at `https://username.github.io/repository-name`

## Data Management

### Adding New Events

To add new timetable events, use the Supabase dashboard or create a simple admin interface:

```sql
INSERT INTO timetable_events (
    day, start_time, end_time, module_name, module_code, 
    event_type, location, lecturer, color_code
) VALUES (
    'Wednesday', '14:00', '15:00', 'New Module', 'POL999',
    'lecture', 'Room 1.01', 'Dr. Lecturer', '#8B1A3D'
);
```

### Updating Events

```sql
UPDATE timetable_events 
SET module_name = 'Updated Module Name',
    location = 'New Location'
WHERE id = 1;
```

### Deleting Events

```sql
DELETE FROM timetable_events WHERE id = 1;
```

## Customization

### Colors

The application uses QMUL's official color scheme. To modify colors, update the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #8B1A3D;    /* QMUL Maroon */
    --secondary-color: #00539B;  /* QMUL Blue */
    --background-color: #F8F9FA;
    /* ... other colors */
}
```

### Time Slots

To modify the time range or intervals, update the configuration in `app.js`:

```javascript
const CONFIG = {
    timeSlots: {
        start: '08:00',    // Change start time
        end: '20:00',      // Change end time
        interval: 30       // Change to 30-minute slots
    }
};
```

### Days

To add or remove days, update the days array in `app.js`:

```javascript
const CONFIG = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
};
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance

- Optimized database queries with proper indexing
- Efficient DOM manipulation
- Lazy loading of non-critical resources
- Responsive images and CSS

## Security

- Row Level Security (RLS) enabled on all tables
- Public read access only (no write operations from frontend)
- Input validation and sanitization
- HTTPS required for production deployment

## Troubleshooting

### Common Issues

1. **Timetable not loading**
   - Check Supabase URL and API key configuration
   - Verify database connection in Supabase dashboard
   - Check browser console for error messages

2. **Events not displaying correctly**
   - Verify time format in database (HH:MM)
   - Check that day names match exactly (case-sensitive)
   - Ensure event_type values match the configuration

3. **Styling issues**
   - Clear browser cache
   - Check that `styles.css` is loading correctly
   - Verify responsive breakpoints

4. **Modal not working**
   - Check JavaScript console for errors
   - Ensure all event listeners are properly attached
   - Verify modal HTML structure

### Debug Mode

To enable debug logging, add this to the top of `app.js`:

```javascript
const DEBUG = true;

function debugLog(message, data) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data);
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is created for educational purposes at Queen Mary University of London.

## Support

For technical support or questions:
- Check the troubleshooting section above
- Review Supabase documentation
- Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Basic timetable functionality
- Supabase integration
- Responsive design
- QMUL branding
- Auto-refresh capability